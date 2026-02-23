import { describe, expect, test } from "vitest";
import {
    codeToConstantName,
    codeToConstructorName,
    codeToMatcherName,
    codeToName,
    codeToParamsName,
} from "../plugin/naming.js";

describe("plugin naming logic", () => {
  test("codeToName stripping and formatting", () => {
    expect(codeToName("ERROR_USER_NOT_FOUND")).toBe("UserNotFound");
    expect(codeToName("ERR_INVALID_ID")).toBe("InvalidId");
    expect(codeToName("RATE_LIMITED")).toBe("RateLimited");
  });

  test("constructor names", () => {
    expect(codeToConstructorName("ERROR_USER_NOT_FOUND")).toBe("newUserNotFound");
  });

  test("matcher names", () => {
    expect(codeToMatcherName("ERROR_USER_NOT_FOUND")).toBe("isUserNotFound");
  });

  test("constant names", () => {
    expect(codeToConstantName("ERROR_USER_NOT_FOUND")).toBe("ErrUserNotFound");
  });

  test("params interface names", () => {
    expect(codeToParamsName("ERROR_USER_NOT_FOUND")).toBe("UserNotFoundParams");
  });
});
