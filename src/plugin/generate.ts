import { getExtension, hasExtension } from "@bufbuild/protobuf";
import { Schema } from "@bufbuild/protoplugin";
import { Code as ProtoCode, connect_error, error } from "./gen/connecterrors/v1/error_pb.js";
import {
  codeToConstantName,
  codeToConstructorName,
  codeToMatcherName,
  codeToParamsName,
} from "./naming.js";

// Extract {{fields}} from the message template
function extractTemplateFields(tpl: string): string[] {
  const matches = tpl.match(/\{\{([^{}]+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(2, -2))));
}

export function generate(schema: Schema) {
  for (const file of schema.files) {
    if (file.services.length === 0) {
      continue;
    }

    const errorDefs = new Map<
      string,
      {
        code: string;
        message: string;
        connectCode: ProtoCode;
        retryable: boolean;
      }
    >();

    // 1. Gather file-level errors
    if (
      schema.targets.includes(file as any) &&
      file.proto.options &&
      hasExtension(file.proto.options as any, error)
    ) {
      const fileErrors = getExtension(file.proto.options as any, error);
      for (const e of fileErrors) {
        errorDefs.set(e.code, e);
      }
    }

    // 2. Gather method-level errors
    for (const service of file.services) {
      for (const method of service.methods) {
        if (method.proto.options && hasExtension(method.proto.options as any, connect_error)) {
          const methodErrors = getExtension(method.proto.options as any, connect_error);
          for (const e of methodErrors) {
            errorDefs.set(e.code, e);
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
    const { create, registerAll, extractErrorCode } = {
      create: f.import("create", "connect-errors"),
      registerAll: f.import("registerAll", "connect-errors"),
      extractErrorCode: f.import("extractErrorCode", "connect-errors"),
    };

    f.print();
    f.print("// ── Error code constants ────────────────────────────");
    for (const def of errorDefs.values()) {
      f.print(`export const ${codeToConstantName(def.code)} = "${def.code}" as const;`);
    }

    f.print();
    f.print("// ── Auto-register ───────────────────────────────────");
    f.print(registerAll, "([");
    for (const def of errorDefs.values()) {
      f.print("  {");
      f.print("    code: ", codeToConstantName(def.code), ",");
      f.print("    messageTpl: ", JSON.stringify(def.message), ",");
      const connectCodeName = ProtoCode[def.connectCode]
        .split("_")
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join("");
      f.print("    connectCode: ", Code, ".", connectCodeName, ",");
      f.print("    retryable: ", def.retryable, ",");
      f.print("  },");
    }
    f.print("]);");

    f.print();
    f.print("// ── Typed constructors ──────────────────────────────");
    for (const def of errorDefs.values()) {
      const fields = extractTemplateFields(def.message);
      const funcName = codeToConstructorName(def.code);
      const paramsName = codeToParamsName(def.code);

      f.print();
      if (fields.length > 0) {
        f.print("export interface ", paramsName, " {");
        for (const field of fields) {
          f.print("  ", field, ": string;");
        }
        f.print("}");
        f.print();
        f.print("export function ", funcName, "(p: ", paramsName, "): ", ConnectError, " {");
        f.print("  return ", create, "(", codeToConstantName(def.code), ", {");
        for (const field of fields) {
          f.print("    ", field, ": p.", field, ",");
        }
        f.print("  });");
        f.print("}");
      } else {
        f.print("export function ", funcName, "(): ", ConnectError, " {");
        f.print("  return ", create, "(", codeToConstantName(def.code), ");");
        f.print("}");
      }
    }

    f.print();
    f.print("// ── Client-side error matchers ──────────────────────");
    for (const def of errorDefs.values()) {
      f.print();
      f.print("export function ", codeToMatcherName(def.code), "(err: unknown): boolean {");
      f.print("  if (!(err instanceof ", ConnectError, ")) return false;");
      f.print("  return ", extractErrorCode, "(err) === ", codeToConstantName(def.code), ";");
      f.print("}");
    }
  }
}
