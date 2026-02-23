export type { ErrorDefinition, ErrorInterceptorFn, M } from "./types.js";

export { MissingFieldError, formatTemplate, templateFields, validateTemplate } from "./template.js";

export { lookup, register, registerAll } from "./registry.js";

export { getHeaderKeys, setHeaderKeys } from "./config.js";

export { create, createWithMessage, createf, fromCode, wrap } from "./create.js";

export { connectCode, extractErrorCode, fromError, isRetryable } from "./inspect.js";

export { errorInterceptor } from "./interceptor.js";

export * from "./codes.js";
