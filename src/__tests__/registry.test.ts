import { Code } from "@connectrpc/connect";
import { beforeEach, expect, test } from "vitest";
import { _clearInternal, codes, lookup, register, registerAll } from "../registry";

beforeEach(() => {
  _clearInternal();
});

test("register and lookup", () => {
  const def = {
    errorCode: "ERR_1",
    statusCode: Code.Internal,
    messageTpl: "msg",
    retryable: false,
  };
  register(def);
  expect(lookup("ERR_1")).toBe(def);
  expect(lookup("ERR_UNKNOWN")).toBeUndefined();
});

test("registerAll", () => {
  const def1 = {
    errorCode: "ERR_1",
    statusCode: Code.Internal,
    messageTpl: "msg1",
    retryable: false,
  };
  const def2 = {
    errorCode: "ERR_2",
    statusCode: Code.NotFound,
    messageTpl: "msg2",
    retryable: true,
  };

  registerAll([def1, def2]);
  expect(lookup("ERR_1")).toBe(def1);
  expect(lookup("ERR_2")).toBe(def2);
});

test("register empty code does nothing", () => {
  const def = { errorCode: "", statusCode: Code.Internal, messageTpl: "msg", retryable: false };
  register(def);
  expect(lookup("")).toBeUndefined();
});

test("codes returns sorted list of registered codes", () => {
  const def1 = {
    errorCode: "ERR_B",
    statusCode: Code.Internal,
    messageTpl: "msg",
    retryable: false,
  };
  const def2 = {
    errorCode: "ERR_A",
    statusCode: Code.Internal,
    messageTpl: "msg",
    retryable: false,
  };
  registerAll([def1, def2]);
  expect(codes()).toEqual(["ERR_A", "ERR_B"]);
});
