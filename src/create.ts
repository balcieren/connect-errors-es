import { Code, ConnectError } from "@connectrpc/connect";
import { getHeaderKeys } from "./config";
import { lookup } from "./registry";
import { formatTemplate, validateTemplate } from "./template";
import { M } from "./types";

function applyMetadata(err: ConnectError, code: string, retryable: boolean): ConnectError {
  const { codeKey, retryableKey } = getHeaderKeys();
  err.metadata.set(codeKey, code);
  err.metadata.set(retryableKey, retryable ? "true" : "false");
  return err;
}

export function create(code: string, data?: M): ConnectError {
  const def = lookup(code);
  if (!def) {
    return applyMetadata(
      new ConnectError(`unknown error code: ${code}`, Code.Internal),
      code,
      false,
    );
  }

  validateTemplate(def.messageTpl, data);
  const message = formatTemplate(def.messageTpl, data);

  return applyMetadata(new ConnectError(message, def.connectCode), code, def.retryable);
}

export function createWithMessage(code: string, message: string, data?: M): ConnectError {
  const def = lookup(code);
  if (!def) {
    return applyMetadata(new ConnectError(message, Code.Internal), code, false);
  }

  if (data) {
    validateTemplate(message, data);
    message = formatTemplate(message, data);
  }

  return applyMetadata(new ConnectError(message, def.connectCode), code, def.retryable);
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
  return applyMetadata(err, code, retryable);
}

export function fromCode(connectCode: Code, message: string): ConnectError {
  return new ConnectError(message, connectCode);
}
