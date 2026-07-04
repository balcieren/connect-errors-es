import { Code, ConnectError } from "@connectrpc/connect";

export type M = Record<string, string>;

export interface ErrorDefinition {
  code: string;
  messageTpl: string;
  connectCode: Code;
  retryable: boolean;
  retryDelayMs?: number;
}

export type ErrorInterceptorFn = (err: ConnectError, def: ErrorDefinition) => void;
