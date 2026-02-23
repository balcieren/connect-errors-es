import { Code, ConnectError } from "@connectrpc/connect";
import { getHeaderKeys } from "./config";
import { lookup } from "./registry";
import { ErrorDefinition } from "./types";

export function extractErrorCode(err: unknown): string | null {
  if (!(err instanceof ConnectError)) {
    return null;
  }

  const { codeKey } = getHeaderKeys();
  const code = err.metadata.get(codeKey);
  if (code) {
    return code;
  }

  // Fallback to searching trailers if headers lack context (some transports merge them or place them in trailers only)
  // Connect headers and trailers are merged in metadata, so metadata.get() checks both.
  return null;
}

export function fromError(err: unknown): ErrorDefinition | null {
  const code = extractErrorCode(err);
  if (!code) {
    return null;
  }
  return lookup(code) || null;
}

export function isRetryable(code: string): boolean {
  const def = lookup(code);
  return def ? def.retryable : false;
}

export function connectCode(code: string): Code | null {
  const def = lookup(code);
  return def ? def.connectCode : null;
}
