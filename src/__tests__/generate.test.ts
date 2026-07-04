import { describe, expect, test } from "vitest";
import { extractTemplateFields } from "../plugin/generate";

describe("plugin extractTemplateFields", () => {
  test("no placeholders returns empty", () => {
    expect(extractTemplateFields("Internal server error")).toEqual([]);
  });

  test("single field", () => {
    expect(extractTemplateFields("User '{{id}}' not found")).toEqual(["id"]);
  });

  test("multiple fields in order", () => {
    expect(extractTemplateFields("{{amount}} exceeds {{limit}} for {{account}}")).toEqual([
      "amount",
      "limit",
      "account",
    ]);
  });

  test("duplicate fields deduplicated", () => {
    expect(extractTemplateFields("{{id}} and {{id}} again")).toEqual(["id"]);
  });

  test("adjacent placeholders", () => {
    expect(extractTemplateFields("{{a}}{{b}}")).toEqual(["a", "b"]);
  });

  test("unclosed placeholder skipped", () => {
    expect(extractTemplateFields("Hello {{name")).toEqual([]);
  });

  test("empty placeholder skipped", () => {
    expect(extractTemplateFields("Hello {{}}")).toEqual([]);
  });

  test("whitespace-only placeholder skipped", () => {
    expect(extractTemplateFields("Hello {{ }}")).toEqual([]);
  });

  test("hyphen field name skipped", () => {
    expect(extractTemplateFields("User {{foo-bar}} and {{id}}")).toEqual(["id"]);
  });

  test("dotted field name skipped", () => {
    expect(extractTemplateFields("User {{foo.bar}} and {{id}}")).toEqual(["id"]);
  });

  test("field with spaces trimmed and accepted", () => {
    expect(extractTemplateFields("User {{ id }}")).toEqual(["id"]);
  });

  test("snake_case field name accepted", () => {
    expect(extractTemplateFields("Product {{product_id}}")).toEqual(["product_id"]);
  });

  test("empty string returns empty", () => {
    expect(extractTemplateFields("")).toEqual([]);
  });
});
