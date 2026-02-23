import { createEcmaScriptPlugin } from "@bufbuild/protoplugin";
import { generate } from "./generate.js";
import { getVersion } from "./version.js";

export function createExtProtoPlugin() {
  return createEcmaScriptPlugin({
    name: "protoc-gen-connect-errors-es",
    version: `v${getVersion()}`,
    generateTs: generate,
  });
}
