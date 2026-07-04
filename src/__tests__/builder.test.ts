import { describe, expect, test } from "vitest";
import { createBuilder } from "../builder";
import { setDomain } from "../index";
import { extractRetryInfo } from "../inspect";

describe("ErrorBuilder", () => {
  test("basic build with data", () => {
    // Built-in codes are registered by default, restore after test
    const err = createBuilder("ERROR_NOT_FOUND", { id: "123" }).build();
    expect(err.message).toContain("Resource not found");
  });

  test("withFieldViolation appends BadRequest detail", () => {
    const err = createBuilder("ERROR_INVALID_ARGUMENT")
      .withFieldViolation("email", "already registered")
      .build();

    // Should have: ErrorInfo + BadRequest
    expect(err.details.length).toBeGreaterThanOrEqual(2);
  });

  test("withRetryDelay sets retry delay", () => {
    const err = createBuilder("ERROR_UNAVAILABLE")
      .withRetryDelay(5000)
      .build();

    const retry = extractRetryInfo(err);
    expect(retry).toBeDefined();
    expect(retry?.retryDelay?.seconds).toBe(5n);
  });

  test("withMessage overrides template", () => {
    setDomain("connecterrors"); // default
    const err = createBuilder("ERROR_NOT_FOUND", { id: "42" })
      .withMessage("Custom '{{id}}' error")
      .build();

    expect(err.message).toContain("Custom '42'");
  });

  test("withMessage + withRetryDelay combined (retryable error)", () => {
    const err = createBuilder("ERROR_UNAVAILABLE")
      .withMessage("Retry later")
      .withRetryDelay(3000)
      .build();

    expect(err.message).toContain("Retry later");

    // Should have RetryInfo with custom delay
    const retry = extractRetryInfo(err);
    expect(retry).toBeDefined();
    expect(retry?.retryDelay?.seconds).toBe(3n);
  });

  test("withMessage alone on retryable error keeps default retry info", () => {
    const err = createBuilder("ERROR_UNAVAILABLE")
      .withMessage("Retry later")
      .build();

    expect(err.message).toContain("Retry later");
    // Default retryDelayMs is 0 for ErrUnavailable
    const retry = extractRetryInfo(err);
    expect(retry).toBeDefined();
    expect(retry?.retryDelay?.seconds).toBe(0n);
  });

  test("withDetail appends custom detail", () => {
    const infoDetail = {
      desc: { typeName: "google.rpc.ErrorInfo" },
      value: { reason: "custom", domain: "test" },
    };

    const err = createBuilder("ERROR_NOT_FOUND")
      .withDetail(infoDetail as never)
      .build();

    expect(err.details.length).toBeGreaterThanOrEqual(1);
  });

  test("chainable API returns same builder", () => {
    const builder = createBuilder("ERROR_NOT_FOUND");
    expect(builder.withFieldViolation("a", "b")).toBe(builder);
    expect(builder.withRetryDelay(1000)).toBe(builder);
    expect(builder.withMessage("msg")).toBe(builder);
  });

  test("multiple field violations accumulate", () => {
    const err = createBuilder("ERROR_INVALID_ARGUMENT")
      .withFieldViolation("email", "taken")
      .withFieldViolation("username", "reserved")
      .build();

    // Should have: ErrorInfo + 2 BadRequest details
    expect(err.details.length).toBeGreaterThanOrEqual(3);
  });
});