import { Code } from "@connectrpc/connect";
import { registerAll } from "./registry";

export const ErrNotFound = "ERROR_NOT_FOUND" as const;
export const ErrInvalidArgument = "ERROR_INVALID_ARGUMENT" as const;
export const ErrAlreadyExists = "ERROR_ALREADY_EXISTS" as const;
export const ErrPermissionDenied = "ERROR_PERMISSION_DENIED" as const;
export const ErrUnauthenticated = "ERROR_UNAUTHENTICATED" as const;
export const ErrInternal = "ERROR_INTERNAL" as const;
export const ErrUnavailable = "ERROR_UNAVAILABLE" as const;
export const ErrDeadlineExceeded = "ERROR_DEADLINE_EXCEEDED" as const;
export const ErrResourceExhausted = "ERROR_RESOURCE_EXHAUSTED" as const;
export const ErrFailedPrecondition = "ERROR_FAILED_PRECONDITION" as const;
export const ErrAborted = "ERROR_ABORTED" as const;
export const ErrOutOfRange = "ERROR_OUT_OF_RANGE" as const;
export const ErrUnimplemented = "ERROR_UNIMPLEMENTED" as const;
export const ErrCanceled = "ERROR_CANCELED" as const;
export const ErrDataLoss = "ERROR_DATA_LOSS" as const;

registerAll([
  {
    code: ErrNotFound,
    connectCode: Code.NotFound,
    messageTpl: "Not found",
    retryable: false,
  },
  {
    code: ErrInvalidArgument,
    connectCode: Code.InvalidArgument,
    messageTpl: "Invalid argument",
    retryable: false,
  },
  {
    code: ErrAlreadyExists,
    connectCode: Code.AlreadyExists,
    messageTpl: "Already exists",
    retryable: false,
  },
  {
    code: ErrPermissionDenied,
    connectCode: Code.PermissionDenied,
    messageTpl: "Permission denied",
    retryable: false,
  },
  {
    code: ErrUnauthenticated,
    connectCode: Code.Unauthenticated,
    messageTpl: "Unauthenticated",
    retryable: false,
  },
  {
    code: ErrInternal,
    connectCode: Code.Internal,
    messageTpl: "Internal system error",
    retryable: false,
  },
  {
    code: ErrUnavailable,
    connectCode: Code.Unavailable,
    messageTpl: "Service unavailable",
    retryable: true,
  },
  {
    code: ErrDeadlineExceeded,
    connectCode: Code.DeadlineExceeded,
    messageTpl: "Deadline exceeded",
    retryable: true,
  },
  {
    code: ErrResourceExhausted,
    connectCode: Code.ResourceExhausted,
    messageTpl: "Resource exhausted",
    retryable: true,
  },
  {
    code: ErrFailedPrecondition,
    connectCode: Code.FailedPrecondition,
    messageTpl: "Failed precondition",
    retryable: false,
  },
  {
    code: ErrAborted,
    connectCode: Code.Aborted,
    messageTpl: "Aborted",
    retryable: true,
  },
  {
    code: ErrOutOfRange,
    connectCode: Code.OutOfRange,
    messageTpl: "Out of range",
    retryable: false,
  },
  {
    code: ErrUnimplemented,
    connectCode: Code.Unimplemented,
    messageTpl: "Unimplemented",
    retryable: false,
  },
  {
    code: ErrCanceled,
    connectCode: Code.Canceled,
    messageTpl: "Canceled",
    retryable: false,
  },
  {
    code: ErrDataLoss,
    connectCode: Code.DataLoss,
    messageTpl: "Data loss",
    retryable: false,
  },
]);
