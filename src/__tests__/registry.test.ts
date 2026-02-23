import { Code } from "@connectrpc/connect";
import { beforeEach, expect, test } from "vitest";
import { clearRegistry, lookup, register, registerAll } from "../registry.js";

beforeEach(() => {
  clearRegistry();
});

test("register and lookup", () => {
  const def = { code: "ERR_1", connectCode: Code.Internal, messageTpl: "msg", retryable: false };
  register(def);
  expect(lookup("ERR_1")).toBe(def);
  expect(lookup("ERR_UNKNOWN")).toBeUndefined();
});

test("registerAll", () => {
  const def1 = { code: "ERR_1", connectCode: Code.Internal, messageTpl: "msg1", retryable: false };
  const def2 = { code: "ERR_2", connectCode: Code.NotFound, messageTpl: "msg2", retryable: true };

  registerAll([def1, def2]);
  expect(lookup("ERR_1")).toBe(def1);
  expect(lookup("ERR_2")).toBe(def2);
});
