import {
  ErrorInfo,
  ErrorInfoSchema,
  RetryInfo,
  RetryInfoSchema,
} from "@buf/googleapis_googleapis.bufbuild_es/google/rpc/error_details_pb";
import { Code, ConnectError } from "@connectrpc/connect";
import { getHeaderKeys } from "./config";
import { lookup } from "./registry";
import { ErrorDefinition } from "./types";

export function extractErrorInfo(err: unknown): ErrorInfo | undefined {
  if (!(err instanceof ConnectError)) return undefined;
  const details = err.findDetails(ErrorInfoSchema);
  return details.length > 0 ? (details[0] as unknown as ErrorInfo) : undefined;
}

export function extractRetryInfo(err: unknown): RetryInfo | undefined {
  if (!(err instanceof ConnectError)) return undefined;
  const details = err.findDetails(RetryInfoSchema);
  return details.length > 0 ? (details[0] as unknown as RetryInfo) : undefined;
}

export function extractErrorCode(err: unknown): string | undefined {
  if (!(err instanceof ConnectError)) {
    return undefined;
  }

  const { codeKey } = getHeaderKeys();
  const code = err.metadata.get(codeKey);
  if (code) {
    return code;
  }

  // Fallback to searching trailers if headers lack context (some transports merge them or place them in trailers only)
  // Connect headers and trailers are merged in metadata, so metadata.get() checks both.
  return undefined;
}

export function fromError(err: unknown): ErrorDefinition | null {
  const code = extractErrorCode(err);
  if (!code) {
    return null;
  }
  return lookup(code) || null;
}

export function isRetryable(errOrCode: unknown): boolean {
  if (typeof errOrCode === "string") {
    const def = lookup(errOrCode);
    return def ? def.retryable : false;
  }
  if (errOrCode instanceof ConnectError) {
    const { retryableKey } = getHeaderKeys();
    return errOrCode.metadata.get(retryableKey) === "true";
  }
  return false;
}

export function connectCode(code: string): Code | null {
  const def = lookup(code);
  return def ? def.connectCode : null;
}

export function matchesError(err: unknown, sentinel: symbol): boolean {
  if (!(err instanceof ConnectError)) return false;
  const code = sentinel.description;
  if (!code) return false;

  const headerCode = extractErrorCode(err);
  if (headerCode === code) return true;

  const info = extractErrorInfo(err);
  return info?.reason === code;
}

export function matchError<T>(err: unknown, matchers: { [key: symbol]: () => T }): T | undefined {
  if (!(err instanceof ConnectError)) return undefined;

  for (const sym of Object.getOwnPropertySymbols(matchers)) {
    if (matchesError(err, sym)) {
      return matchers[sym]();
    }
  }

  return undefined;
}
