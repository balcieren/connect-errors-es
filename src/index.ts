export type { ErrorDefinition, ErrorInterceptorFn, M } from "./types";

export { MissingFieldError, formatTemplate, templateFields, validateTemplate } from "./template";

export { lookup, register, registerAll, codes } from "./registry";

export { getDomain, getHeaderKeys, setDomain, setHeaderKeys } from "./config";

export { create, createWithMessage, createWithRetry, createf, fromCode, wrap, withFieldViolation, setErrorLogger, setValidationLogger } from "./create";
export type { ErrorLogger, ValidationLogger } from "./create";

export {
  connectCode,
  extractErrorCode,
  extractErrorInfo,
  extractRetryInfo,
  fromError,
  isRetryable,
  matchError,
  matchesError,
} from "./inspect";

export { createErrorInterceptor } from "./interceptor";

export { ErrorBuilder, createBuilder, createCtx, setContextExtractor } from "./builder";

export type { ProblemDetails } from "./problem-details";
export { toProblemDetails } from "./problem-details";

export * from "./codes";
