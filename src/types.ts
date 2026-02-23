import { Code, ConnectError } from "@connectrpc/connect";

export type M = Record<string, string>;

export interface ErrorDefinition {
  code: string;
  messageTpl: string;
  connectCode: Code;
  retryable: boolean;
}

export type ErrorInterceptorFn = (err: ConnectError, def: ErrorDefinition) => void;
