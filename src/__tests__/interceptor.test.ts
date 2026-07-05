import { Code, UnaryRequest } from "@connectrpc/connect";
import { expect, test, vi } from "vitest";
import { create } from "../create";
import { createErrorInterceptor } from "../interceptor";
import { _clearInternal, register } from "../registry";

test("errorInterceptor catches ConnectError and extracts definition", async () => {
  _clearInternal();
  register({
    errorCode: "ERR_TEST",
    statusCode: Code.Internal,
    messageTpl: "Test",
    retryable: false,
  });

  const callback = vi.fn();
  const interceptor = createErrorInterceptor(callback);

  const next = vi.fn().mockRejectedValue(create("ERR_TEST"));
  const req = {} as unknown as UnaryRequest;

  await expect(interceptor(next)(req)).rejects.toThrow();

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback.mock.calls[0][1].errorCode).toBe("ERR_TEST");
});
