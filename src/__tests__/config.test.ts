import { expect, test } from "vitest";
import { getHeaderKeys, setHeaderKeys } from "../config.js";

test("header key configuration", () => {
  // Default values
  const defaults = getHeaderKeys();
  expect(defaults.codeKey).toBe("x-error-code");
  expect(defaults.retryableKey).toBe("x-retryable");

  // Custom values
  setHeaderKeys("custom-code", "custom-retry");
  const custom = getHeaderKeys();
  expect(custom.codeKey).toBe("custom-code");
  expect(custom.retryableKey).toBe("custom-retry");

  // Reset back to defaults for other tests
  setHeaderKeys("x-error-code", "x-retryable");
});
