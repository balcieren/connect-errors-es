import { Code, ConnectError } from "@connectrpc/connect";
import { beforeEach, expect, test } from "vitest";
import { getHeaderKeys } from "../config";
import { create, createf, createWithMessage, wrap } from "../create";
import {
  connectCode,
  extractErrorCode,
  extractErrorInfo,
  extractRetryInfo,
  fromError,
  isRetryable,
} from "../inspect";
import { clearRegistry, register } from "../registry";

beforeEach(() => {
  clearRegistry();
  register({
    code: "ERROR_USER_NOT_FOUND",
    connectCode: Code.NotFound,
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
  expect(connectCode("ERROR_USER_NOT_FOUND")).toBe(Code.NotFound);

  const def = fromError(err);
  expect(def?.code).toBe("ERROR_USER_NOT_FOUND");

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
