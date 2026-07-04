let errorCodeHeader = "x-error-code";
let retryableHeader = "x-retryable";
let errorDomain = "connecterrors";

export function setHeaderKeys(codeKey: string, retryableKey: string): void {
  if (codeKey) {
    errorCodeHeader = codeKey;
  }
  if (retryableKey) {
    retryableHeader = retryableKey;
  }
}

export function getHeaderKeys(): { codeKey: string; retryableKey: string } {
  return { codeKey: errorCodeHeader, retryableKey: retryableHeader };
}

export function setDomain(domain: string): void {
  if (domain) {
    errorDomain = domain;
  }
}

export function getDomain(): string {
  return errorDomain;
}
