import { Code, ConnectError } from "@connectrpc/connect";
import { extractErrorCode } from "./inspect";

export interface ProblemDetails {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
  instance?: string;
}

const connectCodeToHTTPStatus: Record<Code, number> = {
  [Code.Canceled]: 499,
  [Code.Unknown]: 500,
  [Code.InvalidArgument]: 400,
  [Code.DeadlineExceeded]: 504,
  [Code.NotFound]: 404,
  [Code.AlreadyExists]: 409,
  [Code.PermissionDenied]: 403,
  [Code.ResourceExhausted]: 429,
  [Code.FailedPrecondition]: 412,
  [Code.Aborted]: 409,
  [Code.OutOfRange]: 400,
  [Code.Unimplemented]: 501,
  [Code.Internal]: 500,
  [Code.Unavailable]: 503,
  [Code.DataLoss]: 500,
  [Code.Unauthenticated]: 401,
};

export function toProblemDetails(err: unknown): ProblemDetails | undefined {
  if (!(err instanceof ConnectError)) {
    return undefined;
  }

  const pd: ProblemDetails = {
    type: "about:blank",
    detail: err.rawMessage,
    status: connectCodeToHTTPStatus[err.code] ?? 500,
  };

  const code = extractErrorCode(err);
  if (code) {
    pd.title = code;
  }

  return pd;
}
