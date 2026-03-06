import { ConnectError, Interceptor } from "@connectrpc/connect";
import { fromError } from "./inspect";
import { ErrorInterceptorFn } from "./types";

/**
 * Creates a Connect RPC interceptor that catches any thrown ConnectErrors
 * and passes them to the provided callback along with their registered ErrorDefinition.
 *
 * This is useful for centralized logging, metrics, or tracing of custom errors.
 */
export function createErrorInterceptor(fn: ErrorInterceptorFn): Interceptor {
  return (next) => async (req) => {
    try {
      return await next(req);
    } catch (err) {
      if (err instanceof ConnectError) {
        const def = fromError(err);
        if (def) {
          fn(err, def);
        }
      }
      throw err;
    }
  };
}
