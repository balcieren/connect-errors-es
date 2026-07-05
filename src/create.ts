import {
  BadRequestSchema,
  ErrorInfoSchema,
  RetryInfoSchema,
} from "@buf/googleapis_googleapis.bufbuild_es/google/rpc/error_details_pb";
import { Code, ConnectError } from "@connectrpc/connect";
import { getDomain, getHeaderKeys } from "./config";
import { lookup } from "./registry";
import { formatTemplate, validateTemplate } from "./template";
import { M } from "./types";

// ErrorLogger is called for every error creation (create, createWithMessage, wrap, etc.).
// Default: no-op (no logging).
//
// Example:
//   setErrorLogger((code, statusCode, retryable, data) => {
//     console.log('error created', { code, statusCode, retryable, data });
//   });
export type ErrorLogger = (code: string, statusCode: Code, retryable: boolean, data?: M) => void;

// ValidationLogger is called when template validation fails.
// Default: no-op (no logging, no throw).
//
// Example:
//   setValidationLogger((code, data, err) => {
//     console.error('template validation failed', { code, data, error: err.message });
//   });
export type ValidationLogger = (code: string, data: M | undefined, err: Error) => void;

// errorLogger is the current error logger. Default: no-op.
let errorLogger: ErrorLogger = () => {};

// validationLogger is the current validation logger. Default: no-op.
let validationLogger: ValidationLogger = () => {};

// setErrorLogger configures a custom logger for all error creations.
//
// Example:
//   // Winston integration
//   import winston from 'winston';
//   const logger = winston.createLogger({ ... });
//   setErrorLogger((code, statusCode, retryable, data) => {
//     logger.info('error created', { code, statusCode, retryable, data });
//   });
//
//   // Sentry integration
//   import * as Sentry from '@sentry/node';
//   setErrorLogger((code, statusCode, retryable, data) => {
//     Sentry.withScope((scope) => {
//       scope.setTag('error_code', code);
//       Sentry.captureMessage(`Error created: ${code}`);
//     });
//   });
export function setErrorLogger(fn: ErrorLogger): void {
  if (fn) {
    errorLogger = fn;
  }
}

// setValidationLogger configures a custom logger for template validation failures.
//
// Example:
//   setValidationLogger((code, data, err) => {
//     console.error('template validation failed', { code, data, error: err.message });
//   });
export function setValidationLogger(fn: ValidationLogger): void {
  if (fn) {
    validationLogger = fn;
  }
}

function sprintf(format: string, ...args: unknown[]): string {
  let argIndex = 0;
  return format.replace(/%([sdifv%])/g, (_, spec: string) => {
    if (spec === "%") return "%";
    const arg = args[argIndex++];
    switch (spec) {
      case "s":
        return String(arg);
      case "d":
      case "i":
        return String(Math.trunc(Number(arg)));
      case "f":
        return String(Number(arg));
      case "v":
        return arg === null ? "null" : arg === undefined ? "undefined" : String(arg);
      default:
        return `%${spec}`;
    }
  });
}

function applyMetadata(
  err: ConnectError,
  code: string,
  retryable: boolean,
  data?: M,
  retryDelayMs?: number,
): ConnectError {
  const { codeKey, retryableKey } = getHeaderKeys();
  err.metadata.set(codeKey, code);
  err.metadata.set(retryableKey, retryable ? "true" : "false");

  err.details.push({
    desc: ErrorInfoSchema,
    value: {
      reason: code,
      domain: getDomain(),
      metadata: data || {},
    },
  });

  if (retryable) {
    const rawDelay = retryDelayMs ?? 0;
    const delayMs = Number.isFinite(rawDelay) ? Math.max(0, rawDelay) : 0;
    const seconds = BigInt(Math.floor(delayMs / 1000));
    const nanos = (delayMs % 1000) * 1_000_000;
    err.details.push({
      desc: RetryInfoSchema,
      value: {
        retryDelay: { seconds, nanos },
      },
    });
  }

  return err;
}

export function create(code: string, data?: M): ConnectError {
  const def = lookup(code);
  if (!def) {
    const err = applyMetadata(
      new ConnectError(`unknown error code: ${code}`, Code.Internal),
      code,
      false,
      data,
    );
    errorLogger(code, Code.Internal, false, data);
    return err;
  }

  try {
    validateTemplate(def.messageTpl, data);
  } catch (e) {
    validationLogger(code, data, e as Error);
  }

  const message = formatTemplate(def.messageTpl, data);
  const err = applyMetadata(
    new ConnectError(message, def.statusCode),
    code,
    def.retryable,
    data,
    def.retryDelayMs,
  );
  errorLogger(code, def.statusCode, def.retryable, data);
  return err;
}

export function createWithRetry(
  code: string,
  data: M | undefined,
  retryDelayMs: number,
): ConnectError {
  const def = lookup(code);
  if (!def) {
    const err = applyMetadata(
      new ConnectError(`unknown error code: ${code}`, Code.Internal),
      code,
      false,
      data,
    );
    errorLogger(code, Code.Internal, false, data);
    return err;
  }

  try {
    validateTemplate(def.messageTpl, data);
  } catch (e) {
    validationLogger(code, data, e as Error);
  }

  const message = formatTemplate(def.messageTpl, data);
  const err = applyMetadata(
    new ConnectError(message, def.statusCode),
    code,
    def.retryable,
    data,
    retryDelayMs,
  );
  errorLogger(code, def.statusCode, def.retryable, data);
  return err;
}

export function createWithMessage(
  code: string,
  message: string,
  data?: M,
  retryDelayMsOverride?: number,
): ConnectError {
  const def = lookup(code);
  if (!def) {
    const delay = retryDelayMsOverride ?? 0;
    const err = applyMetadata(new ConnectError(message, Code.Internal), code, false, data, delay);
    errorLogger(code, Code.Internal, false, data);
    return err;
  }

  if (data) {
    try {
      validateTemplate(message, data);
    } catch (e) {
      validationLogger(code, data, e as Error);
    }
    message = formatTemplate(message, data);
  }

  const delay = retryDelayMsOverride ?? def.retryDelayMs;
  const err = applyMetadata(
    new ConnectError(message, def.statusCode),
    code,
    def.retryable,
    data,
    delay,
  );
  errorLogger(code, def.statusCode, def.retryable, data);
  return err;
}

export function createf(code: string, format: string, ...args: unknown[]): ConnectError {
  const message = args.length > 0 ? sprintf(format, ...args) : format;
  const def = lookup(code);
  if (!def) {
    const err = applyMetadata(new ConnectError(message, Code.Internal), code, false);
    errorLogger(code, Code.Internal, false);
    return err;
  }
  const err = applyMetadata(
    new ConnectError(message, def.statusCode),
    code,
    def.retryable,
    undefined,
    def.retryDelayMs,
  );
  errorLogger(code, def.statusCode, def.retryable);
  return err;
}

export function wrap(code: string, cause: unknown, data?: M): ConnectError {
  const def = lookup(code);
  let message = "unknown error";
  let statusCode = Code.Internal;
  let retryable = false;
  let retryDelayMs: number | undefined;

  if (def) {
    try {
      validateTemplate(def.messageTpl, data);
    } catch (e) {
      validationLogger(code, data, e as Error);
    }
    message = formatTemplate(def.messageTpl, data);
    statusCode = def.statusCode;
    retryable = def.retryable;
    retryDelayMs = def.retryDelayMs;
  }

  const err = new ConnectError(message, statusCode, undefined, undefined, cause);
  const result = applyMetadata(err, code, retryable, data, retryDelayMs);
  errorLogger(code, statusCode, retryable, data);
  return result;
}

export function fromCode(statusCode: Code, message: string): ConnectError {
  return new ConnectError(message, statusCode);
}

export function withFieldViolation(
  err: ConnectError,
  field: string,
  description: string,
): ConnectError {
  err.details.push({
    desc: BadRequestSchema,
    value: {
      fieldViolations: [{ field, description }],
    },
  });
  return err;
}
