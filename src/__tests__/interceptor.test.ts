import { Code } from "@connectrpc/connect";
import { expect, test, vi } from "vitest";
import { create } from "../create";
import { errorInterceptor } from "../interceptor";
import { clearRegistry, register } from "../registry";

test("errorInterceptor catches ConnectError and extracts definition", async () => {
  clearRegistry();
  register({
    code: "ERR_TEST",
    connectCode: Code.Internal,
    messageTpl: "Test",
    retryable: false,
  });

  const callback = vi.fn();
  const interceptor = errorInterceptor(callback);

  const next = vi.fn().mockRejectedValue(create("ERR_TEST"));
  const req = {} as any;

  await expect(interceptor(next)(req)).rejects.toThrow();

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback.mock.calls[0][1].code).toBe("ERR_TEST");
});
