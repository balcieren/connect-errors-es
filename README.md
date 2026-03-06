# connect-errors

[![Test](https://github.com/balcieren/connect-errors-es/actions/workflows/test.yml/badge.svg)](https://github.com/balcieren/connect-errors-es/actions/workflows/test.yml)
[![Lint](https://github.com/balcieren/connect-errors-es/actions/workflows/lint.yml/badge.svg)](https://github.com/balcieren/connect-errors-es/actions/workflows/lint.yml)
[![npm](https://img.shields.io/npm/v/connect-errors)](https://www.npmjs.com/package/connect-errors)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Define errors in `.proto`, generate type-safe TypeScript constructors, catch bugs at compile time.**

The ECMAScript/TypeScript counterpart of [`connect-go-errors`](https://github.com/balcieren/connect-go-errors). A proto-first, isomorphic error handling package for [Connect RPC](https://connectrpc.com) that works on **both server-side** (Node.js, Bun, Deno) **and client-side** (React, Vue, Svelte, browser). Define your errors alongside your service definitions, run `buf generate`, and get fully typed constructor functions with typed parameters — no magic strings, no typos, no runtime surprises.

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
throw newUserNotFound({ id: req.id }); // ← IDE autocomplete, compile-time checked
```

```typescript
// Match errors on the client
if (isUserNotFound(err)) {
  showToast("User not found!");
}
```

> Wrong field name? **Won't compile.** Missing field? **IDE warns you.** Wrong error code? **Doesn't exist.**

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

### Sentinel Pattern (Matching)

The code generator creates a unique `Symbol` (sentinel) for each error defined in your `.proto`. You can use `matchesError` or the switch-like `matchError` utility to handle specific errors gracefully. Both helpers check headers and `ErrorInfo` details out of the box.

```typescript
import { matchError, matchesError } from "connect-errors";
import { UserNotFoundError, RateLimitedError } from "./gen/ts/service_connect_errors";

// Switch-like matching
matchError(err, {
  [UserNotFoundError]: () => showToast("User not found!"),
  [RateLimitedError]: () => showToast("Please slow down."),
});

// Boolean matching
if (matchesError(err, UserNotFoundError)) {
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
import { extractErrorCode, isRetryable, setHeaderKeys } from "connect-errors";

// Optional: Override default header keys globally
setHeaderKeys("x-custom-code", "x-custom-retry");

console.log(extractErrorCode(err)); // "ERROR_USER_NOT_FOUND"
console.log(isRetryable(err)); // true
```

### Global Interceptor

You can use `createErrorInterceptor` on the server-side to centrally log or trace errors using their definitions. It only triggers on known errors registered in your proto files.

```typescript
import { createErrorInterceptor } from "connect-errors";

const loggingInterceptor = createErrorInterceptor((err, def) => {
  console.error("RPC Error:", def.code, "Retryable:", def.retryable);
});
```

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
