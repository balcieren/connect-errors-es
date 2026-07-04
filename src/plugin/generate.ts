import { getExtension, hasExtension } from "@bufbuild/protobuf";
import { Schema } from "@bufbuild/protoplugin";
import { Code as ProtoCode } from "@buf/googleapis_googleapis.bufbuild_es/google/rpc/code_pb.js";
import { rpc_error, file_error } from "./gen/errors/v1/error_pb.js";
import {
  codeToConstantName,
  codeToConstructorName,
  codeToMatcherName,
  codeToParamsName,
} from "./naming";

// extractTemplateFields parses {{placeholder}} names from the message template.
// Returns unique fields in order of first appearance. Invalid field names
// (containing characters other than [a-zA-Z0-9_]) are silently skipped.
export function extractTemplateFields(tpl: string): string[] {
  const matches = tpl.match(/\{\{([^{}]+)\}\}/g);
  if (!matches) return [];
  return Array.from(
    new Set(
      matches
        .map((m) => m.slice(2, -2).trim())
        .filter((field) => field !== "" && /^[a-zA-Z0-9_]+$/.test(field)),
    ),
  );
}

export function generate(schema: Schema) {
  for (const file of schema.files) {
    if (file.services.length === 0) {
      continue;
    }

    const errorDefs = new Map<
      string,
      {
        errorCode: string;
        message: string;
        statusCode: ProtoCode;
        retryable: boolean;
        retryDelayMs: number;
      }
    >();

    // 1. Gather file-level errors
    // We cast schema.targets to any[] here because the @bufbuild/protoplugin v2
    // Target type and DescFile don't always align perfectly in all TS environments.
    if (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (schema.targets as any[]).includes(file) &&
      file.proto.options &&
      hasExtension(file.proto.options, file_error)
    ) {
      const fileErrors = getExtension(file.proto.options, file_error);
      for (const e of fileErrors) {
        errorDefs.set(e.errorCode, {
          errorCode: e.errorCode,
          message: e.message,
          statusCode: e.statusCode,
          retryable: e.retryable,
          retryDelayMs: e.retryDelayMs !== undefined ? Number(e.retryDelayMs) : 0,
        });
      }
    }

    // 2. Gather method-level errors
    for (const service of file.services) {
      for (const method of service.methods) {
        if (method.proto.options && hasExtension(method.proto.options, rpc_error)) {
          const methodErrors = getExtension(method.proto.options, rpc_error);
          for (const e of methodErrors) {
            errorDefs.set(e.errorCode, {
              errorCode: e.errorCode,
              message: e.message,
              statusCode: e.statusCode,
              retryable: e.retryable,
              retryDelayMs: e.retryDelayMs !== undefined ? Number(e.retryDelayMs) : 0,
            });
          }
        }
      }
    }

    if (errorDefs.size === 0) {
      continue;
    }

    const f = schema.generateFile(file.name + "_connect_errors.ts");
    f.preamble(file);

    const Code = f.import("Code", "@connectrpc/connect");
    const ConnectError = f.import("ConnectError", "@connectrpc/connect");
    const { create, registerAll, extractErrorCode, extractErrorInfo } = {
      create: f.import("create", "connect-errors"),
      registerAll: f.import("registerAll", "connect-errors"),
      extractErrorCode: f.import("extractErrorCode", "connect-errors"),
      extractErrorInfo: f.import("extractErrorInfo", "connect-errors"),
    };

    const ErrorInfo = f.import(
      "ErrorInfo",
      "@buf/googleapis_googleapis.bufbuild_es/google/rpc/error_details_pb",
    );

    f.print();
    f.print("// ── Error code constants ────────────────────────────");
    for (const def of errorDefs.values()) {
      f.print(`export const ${codeToConstantName(def.errorCode)} = "${def.errorCode}" as const;`);
    }

    f.print();
    f.print("// ── Auto-register ───────────────────────────────────");
    f.print(registerAll, "([");
    for (const def of errorDefs.values()) {
      f.print("  {");
      f.print("    code: ", codeToConstantName(def.errorCode), ",");
      f.print("    messageTpl: ", JSON.stringify(def.message), ",");
      const rawCodeName = ProtoCode[def.statusCode] ?? "OK";
      let connectCodeName = "";
      if (rawCodeName === "OK") {
        connectCodeName = "Unknown";
      } else if (rawCodeName === "CANCELLED") {
        connectCodeName = "Canceled";
      } else {
        connectCodeName = rawCodeName
          .split("_")
          .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join("");
      }
      f.print("    connectCode: ", Code, ".", connectCodeName, ",");
      f.print("    retryable: ", def.retryable, ",");
      if (def.retryDelayMs > 0) {
        f.print("    retryDelayMs: ", def.retryDelayMs, ",");
      }
      f.print("  },");
    }
    f.print("]);");

    f.print();
    f.print("// ── Typed constructors ──────────────────────────────");
    for (const def of errorDefs.values()) {
      const fields = extractTemplateFields(def.message);
      const funcName = codeToConstructorName(def.errorCode);
      const paramsName = codeToParamsName(def.errorCode);

      f.print();
      if (fields.length > 0) {
        f.print("export interface ", paramsName, " {");
        for (const field of fields) {
          f.print("  ", field, ": string;");
        }
        f.print("}");
        f.print();
        f.print("export function ", funcName, "(p: ", paramsName, "): ", ConnectError, " {");
        f.print("  return ", create, "(", codeToConstantName(def.errorCode), ", {");
        for (const field of fields) {
          f.print("    ", field, ": p.", field, ",");
        }
        f.print("  });");
        f.print("}");
      } else {
        f.print("export function ", funcName, "(): ", ConnectError, " {");
        f.print("  return ", create, "(", codeToConstantName(def.errorCode), ");");
        f.print("}");
      }
    }

    f.print();
    f.print("// ── Client-side error matchers ──────────────────────");
    for (const def of errorDefs.values()) {
      const matcherName = codeToMatcherName(def.errorCode);
      const infoName = matcherName.replace(/^is/, "extract").replace(/Error$/, "Info");

      f.print();
      f.print("export function ", matcherName, "(err: unknown): boolean {");
      f.print("  if (!(err instanceof ", ConnectError, ")) return false;");
      f.print(
          "  if (",
          extractErrorCode,
          "(err) === ",
          codeToConstantName(def.errorCode),
          ") return true;",
      );
      f.print("  const info = ", extractErrorInfo, "(err);");
      f.print("  return info ? info.reason === ", codeToConstantName(def.errorCode), " : false;");
      f.print("}");

      f.print();
      f.print("export function ", infoName, "(err: unknown): ", ErrorInfo, " | undefined {");
      f.print("  return ", matcherName, "(err) ? ", extractErrorInfo, "(err) : undefined;");
      f.print("}");
    }
  }
}
