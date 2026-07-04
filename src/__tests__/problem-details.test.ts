import { Code, ConnectError } from "@connectrpc/connect";
import { describe, expect, test } from "vitest";
import { toProblemDetails } from "../problem-details";
import { clearRegistry, register } from "../registry";

describe("toProblemDetails", () => {
  test("returns undefined for non-ConnectError", () => {
    expect(toProblemDetails(new Error("plain error"))).toBeUndefined();
    expect(toProblemDetails(null)).toBeUndefined();
  });

  test("returns problem details for ConnectError without registered code", () => {
    const err = new ConnectError("something went wrong", Code.Internal);
    const pd = toProblemDetails(err);
    expect(pd).toBeDefined();
    expect(pd?.detail).toBe("something went wrong");
    expect(pd?.status).toBe(500);
    expect(pd?.type).toBe("about:blank");
    expect(pd?.title).toBeUndefined();
  });

  test("returns problem details for ConnectError with registered code", () => {
    clearRegistry();
    register({
      errorCode: "ERROR_NOT_FOUND",
      statusCode: Code.NotFound,
      messageTpl: "User '{{id}}' not found",
      retryable: false,
    });

    const err = new ConnectError("User '123' not found", Code.NotFound);
    err.metadata.set("x-error-code", "ERROR_NOT_FOUND");

    const pd = toProblemDetails(err);
    expect(pd).toBeDefined();
    expect(pd?.detail).toBe("User '123' not found");
    expect(pd?.status).toBe(404);
    expect(pd?.title).toBe("ERROR_NOT_FOUND");
  });
});
