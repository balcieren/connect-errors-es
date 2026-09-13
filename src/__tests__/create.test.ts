import { Code, ConnectError } from "@connectrpc/connect";
import { beforeEach, expect, test } from "vitest";
import { getHeaderKeys } from "../config";
import {
  create,
  createf,
  createWithMessage,
  createWithRetry,
  wrap,
  fromCode,
  setErrorLogger,
  setValidationLogger,
} from "../create";
import {
  statusCode,
  extractErrorCode,
  extractErrorInfo,
  extractRetryInfo,
  fromError,
  isRetryable,
  matchError,
  matchesError,
} from "../inspect";
import { _clearInternal, register } from "../registry";

beforeEach(() => {
  _clearInternal();
  register({
    errorCode: "ERROR_USER_NOT_FOUND",
    statusCode: Code.NotFound,
    messageTpl: "User '{{id}}' not found",
    retryable: true,
  });
});

test("create formatting and headers", () => {
  const err = create("ERROR_USER_NOT_FOUND", { id: "123" });

  expect(err).toBeInstanceOf(ConnectError);
  expect(err.code).toBe(Code.NotFound);
  expect(err.rawMessage).toBe("User '123' not found");

  const { codeKey, retryableKey } = getHeaderKeys();
  expect(err.metadata.get(codeKey)).toBe("ERROR_USER_NOT_FOUND");
  expect(err.metadata.get(retryableKey)).toBe("true");
});

test("createWithMessage overrides template", () => {
  const err = createWithMessage("ERROR_USER_NOT_FOUND", "Custom msg {{id}}", { id: "456" });
  expect(err.rawMessage).toBe("Custom msg 456");
});

test("wrap sets cause", () => {
  const inner = new Error("db failure");
  const err = wrap("ERROR_USER_NOT_FOUND", inner, { id: "999" });
  expect(err.rawMessage).toBe("User '999' not found");
  expect(err.cause).toBe(inner);
});

test("inspection helpers", () => {
  const err = create("ERROR_USER_NOT_FOUND", { id: "1" });

  expect(extractErrorCode(err)).toBe("ERROR_USER_NOT_FOUND");
  expect(isRetryable("ERROR_USER_NOT_FOUND")).toBe(true);
  expect(isRetryable(err)).toBe(true);
  expect(statusCode("ERROR_USER_NOT_FOUND")).toBe(Code.NotFound);

  const def = fromError(err);
  expect(def?.errorCode).toBe("ERROR_USER_NOT_FOUND");

  const errorInfo = extractErrorInfo(err);
  expect(errorInfo).toBeDefined();
  expect(errorInfo?.reason).toBe("ERROR_USER_NOT_FOUND");
  expect(errorInfo?.domain).toBe("connecterrors");
  expect(errorInfo?.metadata["id"]).toBe("1");

  const retryInfo = extractRetryInfo(err);
  expect(retryInfo).toBeDefined();
  expect(retryInfo?.retryDelay?.seconds).toBe(0n);
});

test("unknown code returns internal error with default metadata", () => {
  const err = create("UNKNOWN");
  expect(err.code).toBe(Code.Internal);
  expect(extractErrorCode(err)).toBe("UNKNOWN");
});

test("createf shorthand", () => {
  const err = createf("ERROR_USER_NOT_FOUND", "Direct message");
  expect(err.rawMessage).toBe("Direct message");
});

test("wrap with unknown code", () => {
  const inner = new Error("oops");
  const err = wrap("ABSENT", inner);
  expect(err.code).toBe(Code.Internal);
  expect(err.cause).toBe(inner);
  expect(extractErrorCode(err)).toBe("ABSENT");
});

test("fromCode creates ConnectError directly", () => {
  const err = fromCode(Code.Unavailable, "service down");
  expect(err).toBeInstanceOf(ConnectError);
  expect(err.code).toBe(Code.Unavailable);
  expect(err.rawMessage).toBe("service down");
});

test("wrap with missing template parameters triggers validation logger", () => {
  let loggedCode = "";
  let loggedErr: Error | undefined;
  setValidationLogger((code: string, data: Record<string, string> | undefined, err: Error) => {
    loggedCode = code;
    loggedErr = err;
  });

  const inner = new Error("db error");
  wrap("ERROR_USER_NOT_FOUND", inner, {}); // missing "id" placeholder

  expect(loggedCode).toBe("ERROR_USER_NOT_FOUND");
  expect(loggedErr).toBeDefined();
  expect(loggedErr?.message).toContain("Missing template fields: id");

  setValidationLogger(() => {});
});

test("setErrorLogger captures error creations", () => {
  const logged: Array<{ code: string; statusCode: Code; retryable: boolean }> = [];
  setErrorLogger((code, statusCode, retryable) => {
    logged.push({ code, statusCode, retryable });
  });

  create("ERROR_USER_NOT_FOUND", { id: "1" });

  expect(logged).toHaveLength(1);
  expect(logged[0]).toEqual({
    code: "ERROR_USER_NOT_FOUND",
    statusCode: Code.NotFound,
    retryable: true,
  });

  setErrorLogger(() => {});
});

test("create with missing template fields triggers validation logger", () => {
  let loggedErr: Error | undefined;
  setValidationLogger((_code: string, _data: Record<string, string> | undefined, err: Error) => {
    loggedErr = err;
  });

  const err = create("ERROR_USER_NOT_FOUND", {}); // missing "id" placeholder

  expect(err.rawMessage).toBe("User '{{id}}' not found");
  expect(loggedErr).toBeDefined();
  expect(loggedErr?.message).toContain("Missing template fields: id");

  setValidationLogger(() => {});
});

test("createWithRetry applies custom retry delay", () => {
  const err = createWithRetry("ERROR_USER_NOT_FOUND", { id: "2" }, 1500);
  expect(err.code).toBe(Code.NotFound);

  const retry = extractRetryInfo(err);
  expect(retry?.retryDelay?.seconds).toBe(1n);
  expect(retry?.retryDelay?.nanos).toBe(500000000);
});

test("createWithRetry with missing template fields triggers validation logger", () => {
  let loggedErr: Error | undefined;
  setValidationLogger((_code: string, _data: Record<string, string> | undefined, err: Error) => {
    loggedErr = err;
  });

  createWithRetry("ERROR_USER_NOT_FOUND", {}, 1000); // missing "id" placeholder

  expect(loggedErr).toBeDefined();
  expect(loggedErr?.message).toContain("Missing template fields: id");

  setValidationLogger(() => {});
});

test("createWithRetry with unknown code returns internal error", () => {
  const err = createWithRetry("UNKNOWN", undefined, 1000);
  expect(err.code).toBe(Code.Internal);
  expect(extractErrorCode(err)).toBe("UNKNOWN");
});

test("createWithMessage with unknown code keeps custom message", () => {
  const err = createWithMessage("UNKNOWN", "Custom msg");
  expect(err.code).toBe(Code.Internal);
  expect(err.rawMessage).toBe("Custom msg");
  expect(extractErrorCode(err)).toBe("UNKNOWN");
});

test("createWithMessage with missing template fields triggers validation logger", () => {
  let loggedErr: Error | undefined;
  setValidationLogger((_code: string, _data: Record<string, string> | undefined, err: Error) => {
    loggedErr = err;
  });

  const err = createWithMessage("ERROR_USER_NOT_FOUND", "User '{{id}}' not found", {});

  expect(err.rawMessage).toBe("User '{{id}}' not found");
  expect(loggedErr).toBeDefined();
  expect(loggedErr?.message).toContain("Missing template fields: id");

  setValidationLogger(() => {});
});

test("createf formats message with sprintf specifiers", () => {
  const err = createf(
    "ERROR_USER_NOT_FOUND",
    "User %s (%d) paid %f%% %v %v",
    "alice",
    42,
    2.5,
    null,
    undefined,
  );
  expect(err.rawMessage).toBe("User alice (42) paid 2.5% null undefined");
});

test("createf with unknown code returns internal error", () => {
  const err = createf("UNKNOWN", "Formatted %s", "value");
  expect(err.code).toBe(Code.Internal);
  expect(err.rawMessage).toBe("Formatted value");
  expect(extractErrorCode(err)).toBe("UNKNOWN");
});

test("inspect and match helpers handle non-ConnectError values", () => {
  const plain = new Error("plain error");

  expect(extractErrorInfo(plain)).toBeUndefined();
  expect(extractRetryInfo(plain)).toBeUndefined();
  expect(extractErrorCode(plain)).toBeUndefined();
  expect(fromError(plain)).toBeNull();
  expect(isRetryable(42)).toBe(false);
  expect(matchesError(plain, "ERROR_USER_NOT_FOUND")).toBe(false);
  expect(matchError(plain, { ERROR_USER_NOT_FOUND: () => "not found" })).toBeUndefined();
});
