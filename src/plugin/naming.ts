// naming.ts - Utility functions for converting error codes to TS constructor names

/**
 * Converts an error code string like "ERROR_USER_NOT_FOUND" to a PascalCase name like "UserNotFound"
 * Strips the optional "ERROR_" or "ERR_" prefix.
 */
export function codeToName(code: string): string {
  let name = code;
  if (name.startsWith("ERROR_")) {
    name = name.slice(6);
  } else if (name.startsWith("ERR_")) {
    name = name.slice(4);
  }

  return name
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Examples:
 * "ERROR_USER_NOT_FOUND" -> createUserNotFoundError
 * "RATE_LIMITED" -> createRateLimitedError
 */
export function codeToConstructorName(code: string): string {
  return `create${codeToName(code)}Error`;
}

/**
 * Examples:
 * "ERROR_USER_NOT_FOUND" -> isUserNotFoundError
 */
export function codeToMatcherName(code: string): string {
  return `is${codeToName(code)}Error`;
}

/**
 * Examples:
 * "ERROR_USER_NOT_FOUND" -> ErrorCodeUserNotFound
 */
export function codeToConstantName(code: string): string {
  return `ErrorCode${codeToName(code)}`;
}

/**
 * Examples:
 * "ERROR_USER_NOT_FOUND" -> UserNotFoundParams
 */
export function codeToParamsName(code: string): string {
  return `${codeToName(code)}Params`;
}

/**
 * Examples:
 * "ERROR_USER_NOT_FOUND" -> userNotFoundErrorSentinel
 */
export function codeToSentinelName(code: string): string {
  const name = codeToName(code);
  const camel = name.charAt(0).toLowerCase() + name.slice(1);
  return `${camel}ErrorSentinel`;
}
