import {
  ErrorInfoSchema,
  RetryInfoSchema,
} from "@buf/googleapis_googleapis.bufbuild_es/google/rpc/error_details_pb";
import { Code, ConnectError } from "@connectrpc/connect";
import { getHeaderKeys } from "./config";
import { lookup } from "./registry";
import { formatTemplate, validateTemplate } from "./template";
import { M } from "./types";

function applyMetadata(
  err: ConnectError,
  code: string,
  retryable: boolean,
  data?: M,
): ConnectError {
  const { codeKey, retryableKey } = getHeaderKeys();
  err.metadata.set(codeKey, code);
  err.metadata.set(retryableKey, retryable ? "true" : "false");

  err.details.push({
    desc: ErrorInfoSchema,
    value: {
      reason: code,
      domain: "connecterrors",
      metadata: data || {},
    },
  });

  if (retryable) {
    err.details.push({
      desc: RetryInfoSchema,
      value: {
        retryDelay: { seconds: 0n, nanos: 0 },
      },
    });
  }

  return err;
}

export function create(code: string, data?: M): ConnectError {
  const def = lookup(code);
  if (!def) {
    return applyMetadata(
      new ConnectError(`unknown error code: ${code}`, Code.Internal),
      code,
      false,
      data,
    );
  }

  validateTemplate(def.messageTpl, data);
  const message = formatTemplate(def.messageTpl, data);

  return applyMetadata(new ConnectError(message, def.connectCode), code, def.retryable, data);
}

export function createWithMessage(code: string, message: string, data?: M): ConnectError {
  const def = lookup(code);
  if (!def) {
    return applyMetadata(new ConnectError(message, Code.Internal), code, false, data);
  }

  if (data) {
    validateTemplate(message, data);
    message = formatTemplate(message, data);
  }

  return applyMetadata(new ConnectError(message, def.connectCode), code, def.retryable, data);
}

export function createf(code: string, message: string): ConnectError {
  return createWithMessage(code, message);
}

export function wrap(code: string, cause: unknown, data?: M): ConnectError {
  const def = lookup(code);
  let message = "unknown error";
  let connectCode = Code.Internal;
  let retryable = false;

  if (def) {
    validateTemplate(def.messageTpl, data);
    message = formatTemplate(def.messageTpl, data);
    connectCode = def.connectCode;
    retryable = def.retryable;
  }

  const err = new ConnectError(message, connectCode, undefined, undefined, cause);
  return applyMetadata(err, code, retryable, data);
}

export function fromCode(connectCode: Code, message: string): ConnectError {
  return new ConnectError(message, connectCode);
}
