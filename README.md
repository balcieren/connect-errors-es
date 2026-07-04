# connect-errors

[![Test](https://github.com/balcieren/connect-errors-es/actions/workflows/test.yml/badge.svg)](https://github.com/balcieren/connect-errors-es/actions/workflows/test.yml)
[![Lint](https://github.com/balcieren/connect-errors-es/actions/workflows/lint.yml/badge.svg)](https://github.com/balcieren/connect-errors-es/actions/workflows/lint.yml)
[![npm](https://img.shields.io/npm/v/connect-errors)](https://www.npmjs.com/package/connect-errors)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Define errors in `.proto`, generate type-safe TypeScript constructors, catch bugs at compile time.**

The ECMAScript/TypeScript counterpart of [`connect-errors-go`](https://github.com/balcieren/connect-errors-go). A proto-first, isomorphic error handling package for [Connect RPC](https://connectrpc.com) that works on **both server-side** (Node.js, Bun, Deno) **and client-side** (React, Vue, Svelte, browser). Define your errors alongside your service definitions, run `buf generate`, and get fully typed constructor functions with typed parameters — no magic strings, no typos, no runtime surprises.

```protobuf
// Define in your .proto file
option (connecterrors.v1.error) = {
  code: "ERROR_USER_NOT_FOUND"
  message: "User '{{id}}' not found"
  connect_code: CODE_NOT_FOUND
};
```

```typescript
// Use the generated typed constructor (server-side)
throw createUserNotFoundError({ id: req.id }); // ← IDE autocomplete, compile-time checked
```

```typescript
// Match errors on the client
if (isUserNotFoundError(err)) {
  showToast("User not found!");
}
```

> Wrong field name? **Won't compile.** Missing field? **IDE warns you.** Wrong error code? **Doesn't exist.**

## Features

| Feature                       | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| 🔧 **Proto-first**            | Errors live in `.proto` files next to your service definitions |
| ⚡ **Generated Constructors** | `createXxxError(XxxParams)` — fully typed, zero string literals |
| 🎯 **Compile-time safe**      | `ErrorCodeXxx` constants + typed params catch all typos        |
| 📝 **Template Messages**      | `{{placeholder}}` → typed params, validated at runtime         |
| 🔄 **Retryable Errors**       | Mark errors as retryable with custom retry delays in proto     |
| 🪝 **Interceptor**            | Server-side hook for logging, metrics, and tracing             |
| 🔀 **Error Matching**         | `matchesError` + `matchError` (switch-like)                    |
| 🔨 **Error Builder**          | Chainable API: `.withFieldViolation().withRetryDelay().build()` |
| 🌐 **RFC 7807**               | `toProblemDetails()` for REST/HTTP adapters                    |
| 🏷️ **Configurable Domain**    | `setDomain("myapp")` for `google.rpc.ErrorInfo`               |
| 🧩 **Context-aware**          | `createCtx()` + `setContextExtractor()` for trace IDs, etc.    |
| 📋 **Registry Introspection** | `codes()` returns sorted list of all registered error codes    |

## Quick Start

```bash
npm install connect-errors
```

For code generation:

```bash
npm install -D connect-errors
```

---

## Step 1: Configure Buf

First, add the protobuf dependency to your `buf.yaml`:

```yaml
# buf.yaml
version: v2
modules:
  - path: proto
deps:
  - buf.build/balcieren/connect-errors
```

Run `buf dep update` to download the schema.

### Option A: Local Mode

Configure `buf.gen.yaml` to use your local binary (installed via `npm install -D connect-errors`):

```yaml
# buf.gen.yaml
version: v2

managed:
  enabled: true

plugins:
  - local: protoc-gen-es
    out: gen/ts
    opt: target=ts
  - local: protoc-gen-connect-es
    out: gen/ts
    opt: target=ts
  # ⭐ Local plugin binary provided by npm
  - local: protoc-gen-connect-errors-es
    out: gen/ts
    opt: target=ts

  # Note: If buf cannot find the plugin in your environment,
  # you can explicitly invoke it via npx:
  # - local: ["npx", "connect-errors"]
  #   out: gen/ts
  #   opt: target=ts
```

Then run `buf` via `npx` so it finds the binary in your `node_modules`:

```bash
npx buf generate
```

### Option B: Basic Protoc (without Buf)

If you don't use Buf and rely on the standard `protoc` compiler, you can invoke the local plugin via `npx` directly in your terminal command:

```bash
npx protoc \
  --es_out=gen/ts \
  --connect-es_out=gen/ts \
  --connect-errors-es_out=gen/ts \
  --plugin=protoc-gen-connect-errors-es=./node_modules/.bin/protoc-gen-connect-errors-es \
  proto/service.proto
```

## Step 2: Define Errors in Proto

See the [full instructions](https://buf.build/balcieren/connect-errors) for defining errors using the custom `connecterrors.v1` proto options.

## Step 3: Available Connect Error Codes

When defining errors in your `.proto` file, use the following values for the `connect_code` field. These map to standard [Connect RPC status codes](https://connectrpc.com/docs/protocol/#error-codes).

| `connect_code`             | Description                                                                             |
| :------------------------- | :-------------------------------------------------------------------------------------- |
| `CODE_CANCELED`            | The operation was canceled.                                                             |
| `CODE_UNKNOWN`             | Unknown error.                                                                          |
| `CODE_INVALID_ARGUMENT`    | Client specified an invalid argument.                                                   |
| `CODE_DEADLINE_EXCEEDED`   | Deadline expired before operation could complete.                                       |
| `CODE_NOT_FOUND`           | Some requested entity was not found.                                                    |
| `CODE_ALREADY_EXISTS`      | Some entity that we attempted to create already exists.                                 |
| `CODE_PERMISSION_DENIED`   | The caller does not have permission to execute the operation.                           |
| `CODE_RESOURCE_EXHAUSTED`  | Some resource has been exhausted (e.g. per-user quota).                                 |
| `CODE_FAILED_PRECONDITION` | Operation was rejected because the system is not in a state required for its execution. |
| `CODE_ABORTED`             | The operation was aborted.                                                              |
| `CODE_OUT_OF_RANGE`        | Operation was attempted past the valid range.                                           |
| `CODE_UNIMPLEMENTED`       | Operation is not implemented or not supported/enabled.                                  |
| `CODE_INTERNAL`            | Internal errors.                                                                        |
| `CODE_UNAVAILABLE`         | The service is currently unavailable.                                                   |
| `CODE_DATA_LOSS`           | Unrecoverable data loss or corruption.                                                  |
| `CODE_UNAUTHENTICATED`     | The request does not have valid authentication credentials.                             |

## Features & Usage

### Error Matching

The library provides `matchesError` and `matchError` (switch-like) utilities to handle specific errors gracefully. Both helpers check headers and `ErrorInfo` details out of the box using your generated `ErrorCodeXxx` constants.

```typescript
import { matchError, matchesError } from "connect-errors";
import { ErrorCodeUserNotFound, ErrorCodeRateLimited } from "./gen/ts/service_connect_errors";

// Switch-like matching
matchError(err, {
  [ErrorCodeUserNotFound]: () => showToast("User not found!"),
  [ErrorCodeRateLimited]: () => showToast("Please slow down."),
});

// Boolean matching
if (matchesError(err, ErrorCodeUserNotFound)) {
  // ...
}
```

### Protocol Buffer Details (ErrorInfo & RetryInfo)

When throwing an error from the server side, `connect-errors` automatically attaches standard `google.rpc.ErrorInfo` and `google.rpc.RetryInfo` (if `retryable: true`) details to the `ConnectError`.

You can extract them on the client:

```typescript
import { extractErrorInfo, extractRetryInfo } from "connect-errors";
import { extractUserNotFoundInfo } from "./gen/ts/service_connect_errors";

const errorInfo = extractErrorInfo(err);
console.log(errorInfo?.reason); // "ERROR_USER_NOT_FOUND"
console.log(errorInfo?.metadata); // { id: "123" }

// Or use the generated typed extractor for specific errors:
const userInfo = extractUserNotFoundInfo(err);
if (userInfo) {
  console.log("Missing user ID:", userInfo.metadata.id);
}

const retryInfo = extractRetryInfo(err);
console.log(retryInfo?.retryDelay?.seconds);
```

### Header Metadata

By default, the library attaches `x-error-code` and `x-retryable` HTTP headers to all created errors. This is useful for load balancers or lightweight clients that don't want to parse protobuf Any details.

```typescript
import { extractErrorCode, isRetryable, setDomain, setHeaderKeys } from "connect-errors";

// Optional: Override default header keys globally (empty string preserves existing value)
setHeaderKeys("x-custom-code", "x-custom-retry");

// Optional: Override default error domain (used in google.rpc.ErrorInfo)
setDomain("myapp");

console.log(extractErrorCode(err)); // "ERROR_USER_NOT_FOUND"
console.log(isRetryable(err)); // true
```

### Advanced Error Construction

```typescript
import {
  createBuilder,
  createCtx,
  createWithRetry,
  setContextExtractor,
  toProblemDetails,
  withFieldViolation,
} from "connect-errors";

// Custom retry delay
const err = createWithRetry(ErrorCodeRateLimited, {}, 5000);

// Field violations (google.rpc.BadRequest)
withFieldViolation(err, "email", "already registered");

// Chainable builder
const built = createBuilder(ErrorCodeInvalidArgument, { reason: "bad" })
  .withFieldViolation("email", "taken")
  .withRetryDelay(5000)
  .build();

// Context-aware error creation
setContextExtractor((ctx) => ({ trace_id: ctx.traceId }));
const ctxErr = createCtx(ctx, ErrorCodeNotFound, { id: "123" });

// RFC 7807 Problem Details
const pd = toProblemDetails(err);
// pd.status = 429, pd.title = "ERROR_RATE_LIMITED"
```

### Logging

Connect errors provides two customizable loggers:

- **ErrorLogger**: Called for every error creation (`create`, `createWithMessage`, `wrap`, etc.)
- **ValidationLogger**: Called when template validation fails (missing placeholder data)

Both default to no-op. Configure them to integrate with your logging/monitoring stack:

```typescript
import { setErrorLogger, setValidationLogger } from "connect-errors";

// Log all errors
setErrorLogger((code, connectCode, retryable, data) => {
  console.log("error created", { code, connectCode, retryable, data });
});

// Log validation failures
setValidationLogger((code, data, err) => {
  console.error("template validation failed", { code, data, error: err.message });
});
```

#### Integration Examples

```typescript
// Winston
import winston from "winston";
const logger = winston.createLogger({ /* ... */ });
setErrorLogger((code, connectCode, retryable, data) => {
  logger.info("error created", { code, connectCode, retryable, data });
});

// Sentry
import * as Sentry from "@sentry/node";
setErrorLogger((code, connectCode, retryable, data) => {
  Sentry.withScope((scope) => {
    scope.setTag("error_code", code);
    scope.setContext("data", data);
    Sentry.captureMessage(`Error created: ${code}`);
  });
});

// Prometheus metrics
setErrorLogger((code, connectCode, retryable, data) => {
  errorsCreatedCounter.inc({ code, connect_code: connectCode });
});
```

### Global Interceptor

You can use `createErrorInterceptor` on the server-side to centrally log or trace errors using their definitions. It only triggers on known errors registered in your proto files.

```typescript
import { createErrorInterceptor } from "connect-errors";

const loggingInterceptor = createErrorInterceptor((err, def) => {
  console.error("RPC Error:", def.code, "Retryable:", def.retryable);
});
```

### Registry Introspection

```typescript
import { codes } from "connect-errors";

// Get a sorted list of all registered error codes (useful for debugging, admin UIs)
console.log(codes()); // ["ERROR_NOT_FOUND", "ERROR_INTERNAL", ...]
```

---

## API Reference

### Error Creation

| Function                          | Description                                   |
| --------------------------------- | --------------------------------------------- |
| `create(code, data?)`             | Create error from registry with template data |
| `createWithMessage(code, message, data?)` | Override default template message     |
| `createf(code, format, ...args)`  | Format-string style error creation            |
| `wrap(code, cause, data?)`        | Wrap underlying error with context            |
| `fromCode(connectCode, message)`  | Create directly from connect `Code`           |
| `createWithRetry(code, data, delayMs)` | Create error with custom retry delay     |
| `createCtx(ctx, code, data?)`     | Create error with context-extracted metadata  |
| `createBuilder(code, data?)`      | Chainable builder for complex errors          |
| `withFieldViolation(err, field, msg)` | Add `google.rpc.BadRequest` FieldViolation |

### Error Inspection

| Function                       | Description                              |
| ------------------------------ | ---------------------------------------- |
| `fromError(err)`               | Extract `ErrorDefinition` from metadata  |
| `extractErrorCode(err)`        | Get just the error code string           |
| `extractErrorInfo(err)`        | Extract `google.rpc.ErrorInfo` detail    |
| `extractRetryInfo(err)`        | Extract `google.rpc.RetryInfo` detail    |
| `isRetryable(codeOrErr)`       | Check if an error code or error is retryable |
| `connectCode(code)`            | Get the connect `Code` for an error code |
| `matchesError(err, code)`      | Check if an error matches a code         |
| `matchError(err, matchers)`    | Switch-like error matching               |
| `toProblemDetails(err)`        | Convert to RFC 7807 Problem Details      |

### Registry

| Function            | Description                                 |
| ------------------- | ------------------------------------------- |
| `register(def)`     | Register an error definition                |
| `registerAll(defs)` | Register multiple error definitions         |
| `lookup(code)`      | Look up an error definition by code         |
| `codes()`           | Return sorted list of all registered codes  |

### Configuration

| Function                         | Description                                   |
| -------------------------------- | --------------------------------------------- |
| `setHeaderKeys(codeKey, retryableKey)` | Customize metadata header keys          |
| `getHeaderKeys()`                | Get current header keys                       |
| `setDomain(domain)`              | Configure global error domain                 |
| `getDomain()`                    | Get the current error domain                  |
| `setContextExtractor(fn)`        | Configure context-to-metadata extraction      |
| `setErrorLogger(fn)`             | Configure logger for all error creations      |
| `setValidationLogger(fn)`        | Configure logger for template validation failures |

### Template Utilities

```typescript
import { templateFields, validateTemplate, formatTemplate } from "connect-errors";

templateFields("User '{{id}}' in {{org}}");     // → ["id", "org"]
validateTemplate("User '{{id}}'", {});           // → throws MissingFieldError
formatTemplate("User '{{id}}'", { id: "123" }); // → "User '123'"
```

### Error Builder

```typescript
import { createBuilder } from "connect-errors";

// All builder methods can be chained together — withMessage + withRetryDelay work in combination
const err = createBuilder("ERROR_INVALID_ARGUMENT", { reason: "bad" })
  .withFieldViolation("email", "already registered")
  .withRetryDelay(5000)
  .withMessage("custom message")
  .withDetail(detail)
  .build();
```

| Method | Description |
| --- | --- |
| `withDetail(detail)` | Add a protobuf detail |
| `withRetryDelay(ms)` | Set retry delay in milliseconds |
| `withFieldViolation(field, msg)` | Add field violation |
| `withMessage(msg)` | Override template message |
| `build()` | Build the ConnectError |

### Types

```typescript
type M = Record<string, string>;

interface ErrorDefinition {
  code: string;
  messageTpl: string;
  connectCode: Code;
  retryable: boolean;
  retryDelayMs?: number;
}

interface ProblemDetails {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
  instance?: string;
}

class MissingFieldError extends Error {
  template: string;
  missing: string[];
}
```

---

## Alternative: Manual Usage (Without Proto)

If you don't use proto-based definitions, you can define errors manually:

```typescript
import { register, registerAll, create, ErrNotFound } from "connect-errors";
import { Code } from "@connectrpc/connect";

// Register a single error
register({
  code: "ERROR_EMAIL_TAKEN",
  messageTpl: "Email '{{email}}' is taken",
  connectCode: Code.AlreadyExists,
  retryable: false,
});

// Register multiple errors
registerAll([
  {
    code: "ERROR_USER_NOT_FOUND",
    messageTpl: "User '{{id}}' not found",
    connectCode: Code.NotFound,
    retryable: false,
  },
  {
    code: "ERROR_RATE_LIMITED",
    messageTpl: "Too many requests",
    connectCode: Code.ResourceExhausted,
    retryable: true,
  },
]);

// Use with the generic API
const err = create("ERROR_EMAIL_TAKEN", { email });

// Or use built-in codes
const err2 = create(ErrNotFound);
const err3 = wrap(ErrInternal, dbError);
const err4 = createf(ErrNotFound, "User %q not found", id);
```

---

## Built-in Error Codes

Pre-defined `ErrorCode` constants provided by the library:

| Constant | Default Connect Code | Default Retryable |
| --- | --- | --- |
| `ErrNotFound` | `Code.NotFound` | No |
| `ErrInvalidArgument` | `Code.InvalidArgument` | No |
| `ErrAlreadyExists` | `Code.AlreadyExists` | No |
| `ErrPermissionDenied` | `Code.PermissionDenied` | No |
| `ErrUnauthenticated` | `Code.Unauthenticated` | No |
| `ErrInternal` | `Code.Internal` | No |
| `ErrUnavailable` | `Code.Unavailable` | Yes |
| `ErrDeadlineExceeded` | `Code.DeadlineExceeded` | Yes |
| `ErrResourceExhausted` | `Code.ResourceExhausted` | Yes |
| `ErrFailedPrecondition` | `Code.FailedPrecondition` | No |
| `ErrAborted` | `Code.Aborted` | Yes |
| `ErrOutOfRange` | `Code.OutOfRange` | No |
| `ErrUnimplemented` | `Code.Unimplemented` | No |
| `ErrCanceled` | `Code.Canceled` | No |
| `ErrDataLoss` | `Code.DataLoss` | No |

---

## Error Metadata & Details

Every error includes both HTTP/gRPC metadata headers and Protobuf `Any` details:

### Headers

| Header | Example |
| --- | --- |
| `x-error-code` | `ERROR_NOT_FOUND` |
| `x-retryable` | `true` / `false` |

### Protobuf Details

- `google.rpc.ErrorInfo`: Attached to all errors. `reason` contains the error code, `domain` defaults to `"connecterrors"` (configurable via `setDomain()`), and `metadata` contains the template variables.
- `google.rpc.RetryInfo`: Attached automatically when `retryable` is true. Delay defaults to zero but can be set via `retryDelayMs` in proto or `createWithRetry()` at runtime.
- `google.rpc.BadRequest`: Attached via `withFieldViolation()` for input validation failures.

Use the provided extractors to safely parse details:

```typescript
import { extractErrorInfo, extractRetryInfo } from "connect-errors";

const info = extractErrorInfo(err);
if (info) {
  console.log(info.reason);   // "ERROR_NOT_FOUND"
  console.log(info.metadata); // { id: "123" }
}

const retry = extractRetryInfo(err);
if (retry) {
  console.log("Is retryable!");
}
```

---

## Concurrency & SSR Safety

Global configuration functions (`setDomain`, `setHeaderKeys`, `setErrorLogger`, `setContextExtractor`) modify package-level state. In **server-side rendering (SSR)** environments (Next.js, Nuxt, SvelteKit) where multiple requests share the same process:

- **Set global config once** at module load time (e.g., in `init` or a setup function), not per-request
- **Use `createBuilder()` with `.withDomain()`** for per-request domain overrides instead of `setDomain()`
- **Avoid calling `setHeaderKeys()` concurrently** — configure it once at startup

The registry (`register`, `registerAll`) is safe for concurrent use. Error creation functions (`create`, `wrap`, `createWithMessage`, etc.) are safe to call concurrently.

---

## Compatibility

| Environment        | Supported |
| ------------------ | --------- |
| Node.js 18+        | ✅        |
| Bun                | ✅        |
| Deno               | ✅        |
| Browser (ESM)      | ✅        |
| React / Next.js    | ✅        |
| Vue / Nuxt         | ✅        |
| Svelte / SvelteKit | ✅        |
| React Native       | ✅        |

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
