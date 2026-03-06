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
 * "ERROR_USER_NOT_FOUND" -> newUserNotFound
 * "RATE_LIMITED" -> newRateLimited
 */
export function codeToConstructorName(code: string): string {
  return `new${codeToName(code)}`;
}

/**
 * Examples:
 * "ERROR_USER_NOT_FOUND" -> isUserNotFound
 */
export function codeToMatcherName(code: string): string {
  return `is${codeToName(code)}`;
}

/**
 * Examples:
 * "ERROR_USER_NOT_FOUND" -> ErrUserNotFound
 */
export function codeToConstantName(code: string): string {
  return `Err${codeToName(code)}`;
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
 * "ERROR_USER_NOT_FOUND" -> UserNotFoundError
 */
export function codeToSentinelName(code: string): string {
  return `${codeToName(code)}Error`;
}
