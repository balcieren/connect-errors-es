import { ConnectError } from "@connectrpc/connect";
import { create, createWithMessage, createWithRetry, withFieldViolation } from "./create";
import { M } from "./types";

export interface BuilderFieldViolation {
  field: string;
  description: string;
}

interface ErrorDetailLike {
  desc: unknown;
  value: unknown;
}

export class ErrorBuilder {
  private code: string;
  private data: M | undefined;
  private retryDelayMs: number | undefined;
  private details: ErrorDetailLike[] = [];
  private violations: BuilderFieldViolation[] = [];
  private customMsg: string | undefined;

  constructor(code: string, data?: M) {
    this.code = code;
    this.data = data;
  }

  withDetail(detail: ErrorDetailLike): this {
    if (detail) {
      this.details.push(detail);
    }
    return this;
  }

  withRetryDelay(ms: number): this {
    this.retryDelayMs = ms;
    return this;
  }

  withFieldViolation(field: string, description: string): this {
    this.violations.push({ field, description });
    return this;
  }

  withMessage(msg: string): this {
    this.customMsg = msg;
    return this;
  }

  build(): ConnectError {
    let err: ConnectError;
    const retryDelay =
      this.retryDelayMs !== undefined && this.retryDelayMs > 0 ? this.retryDelayMs : undefined;

    if (this.customMsg) {
      err = createWithMessage(this.code, this.customMsg, this.data, retryDelay);
    } else if (retryDelay !== undefined) {
      err = createWithRetry(this.code, this.data, retryDelay);
    } else {
      err = create(this.code, this.data);
    }

    for (const v of this.violations) {
      withFieldViolation(err, v.field, v.description);
    }

    for (const d of this.details) {
      err.details.push({ desc: d.desc as never, value: d.value as never });
    }

    return err;
  }
}

export function createBuilder(code: string, data?: M): ErrorBuilder {
  return new ErrorBuilder(code, data);
}

let contextExtractor: (ctx: unknown) => M = () => ({});

export function setContextExtractor(fn: (ctx: unknown) => M): void {
  if (fn) {
    contextExtractor = fn;
  }
}

export function createCtx(ctx: unknown, code: string, data?: M): ConnectError {
  const ctxData = contextExtractor(ctx);
  const merged: M = { ...ctxData, ...(data || {}) };
  return create(code, merged);
}
