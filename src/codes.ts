import { Code } from "@connectrpc/connect";
import { _clearInternal, registerAll } from "./registry";

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

export function registerDefaults(): void {
  registerAll([
    {
      errorCode: ErrNotFound,
      statusCode: Code.NotFound,
      messageTpl: "Resource not found",
      retryable: false,
    },
    {
      errorCode: ErrInvalidArgument,
      statusCode: Code.InvalidArgument,
      messageTpl: "Invalid argument",
      retryable: false,
    },
    {
      errorCode: ErrAlreadyExists,
      statusCode: Code.AlreadyExists,
      messageTpl: "Resource already exists",
      retryable: false,
    },
    {
      errorCode: ErrPermissionDenied,
      statusCode: Code.PermissionDenied,
      messageTpl: "Permission denied",
      retryable: false,
    },
    {
      errorCode: ErrUnauthenticated,
      statusCode: Code.Unauthenticated,
      messageTpl: "Authentication required",
      retryable: false,
    },
    {
      errorCode: ErrInternal,
      statusCode: Code.Internal,
      messageTpl: "Internal server error",
      retryable: false,
    },
    {
      errorCode: ErrUnavailable,
      statusCode: Code.Unavailable,
      messageTpl: "Service unavailable",
      retryable: true,
    },
    {
      errorCode: ErrDeadlineExceeded,
      statusCode: Code.DeadlineExceeded,
      messageTpl: "Deadline exceeded",
      retryable: true,
    },
    {
      errorCode: ErrResourceExhausted,
      statusCode: Code.ResourceExhausted,
      messageTpl: "Resource exhausted",
      retryable: true,
    },
    {
      errorCode: ErrFailedPrecondition,
      statusCode: Code.FailedPrecondition,
      messageTpl: "Failed precondition",
      retryable: false,
    },
    {
      errorCode: ErrAborted,
      statusCode: Code.Aborted,
      messageTpl: "Operation aborted",
      retryable: true,
    },
    {
      errorCode: ErrOutOfRange,
      statusCode: Code.OutOfRange,
      messageTpl: "Value out of range",
      retryable: false,
    },
    {
      errorCode: ErrUnimplemented,
      statusCode: Code.Unimplemented,
      messageTpl: "Operation not implemented",
      retryable: false,
    },
    {
      errorCode: ErrCanceled,
      statusCode: Code.Canceled,
      messageTpl: "RPC canceled",
      retryable: false,
    },
    {
      errorCode: ErrDataLoss,
      statusCode: Code.DataLoss,
      messageTpl: "Unrecoverable data loss",
      retryable: false,
    },
  ]);
}

// Initialize default error definitions on module load
registerDefaults();

// resetRegistry restores the registry to the default error definitions.
// This is primarily useful for testing: it clears any custom registrations
// and reloads the built-in defaults. Matches Go's ResetRegistry behavior.
export function resetRegistry(): void {
  _clearInternal();
  registerDefaults();
}
