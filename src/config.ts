let errorCodeHeader = "x-error-code";
let retryableHeader = "x-retryable";

export function setHeaderKeys(codeKey: string, retryableKey: string): void {
  errorCodeHeader = codeKey;
  retryableHeader = retryableKey;
}

export function getHeaderKeys(): { codeKey: string; retryableKey: string } {
  return { codeKey: errorCodeHeader, retryableKey: retryableHeader };
}
