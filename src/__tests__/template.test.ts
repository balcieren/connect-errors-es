import { expect, test } from "vitest";
import {
  formatTemplate,
  MissingFieldError,
  templateFields,
  validateTemplate,
} from "../template.js";

test("templateFields", () => {
  expect(templateFields("User '{{id}}' in {{org}}")).toEqual(["id", "org"]);
  expect(templateFields("No fields here")).toEqual([]);
  expect(templateFields("{{only}}")).toEqual(["only"]);
  expect(templateFields("{{dup}} and {{dup}}")).toEqual(["dup"]);
});

test("validateTemplate", () => {
  expect(() => validateTemplate("User {{id}}", { id: "123" })).not.toThrow();
  expect(() => validateTemplate("No fields", {})).not.toThrow();

  expect(() => validateTemplate("User {{id}}", {})).toThrowError(MissingFieldError);
  expect(() => validateTemplate("User {{id}} in {{org}}", { id: "1" })).toThrowError(
    MissingFieldError,
  );
});

test("formatTemplate", () => {
  expect(formatTemplate("User {{id}}", { id: "123" })).toBe("User 123");
  expect(formatTemplate("User {{id}} in {{org}}", { id: "1", org: "ACME" })).toBe("User 1 in ACME");

  // Missing fields stay as placeholders if validate isn't called
  expect(formatTemplate("User {{id}}", {})).toBe("User {{id}}");
});
