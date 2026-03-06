import { Code, ConnectError } from "@connectrpc/connect";
import { beforeEach, expect, test } from "vitest";
import { create } from "../create";
import { matchError, matchesError } from "../inspect";
import { clearRegistry, register } from "../registry";

const UserNotFoundError = Symbol("ERROR_USER_NOT_FOUND");
const RateLimitedError = Symbol("ERROR_RATE_LIMITED");

beforeEach(() => {
  clearRegistry();
  register({
    code: "ERROR_USER_NOT_FOUND",
    connectCode: Code.NotFound,
    messageTpl: "User '{{id}}' not found",
    retryable: false,
  });
  register({
    code: "ERROR_RATE_LIMITED",
    connectCode: Code.ResourceExhausted,
    messageTpl: "Slow down",
    retryable: true,
  });
});

test("matchesError correctly matches sentinels", () => {
  const err = create("ERROR_USER_NOT_FOUND", { id: "1" });

  expect(matchesError(err, UserNotFoundError)).toBe(true);
  expect(matchesError(err, RateLimitedError)).toBe(false);

  const unknownErr = new ConnectError("unknown", Code.Internal);
  expect(matchesError(unknownErr, UserNotFoundError)).toBe(false);
});

test("matchError switch-like behavior", () => {
  const err = create("ERROR_RATE_LIMITED");

  const result = matchError(err, {
    [UserNotFoundError]: () => "not found",
    [RateLimitedError]: () => "slow down",
  });

  expect(result).toBe("slow down");

  const notMatched = matchError(new ConnectError("other"), {
    [UserNotFoundError]: () => "not found",
  });

  expect(notMatched).toBeUndefined();
});
