import { createEcmaScriptPlugin } from "@bufbuild/protoplugin";
import { generate } from "./generate";
import { getVersion } from "./version";

export function createExtProtoPlugin() {
  return createEcmaScriptPlugin({
    name: "protoc-gen-connect-errors-es",
    version: `v${getVersion()}`,
    generateTs: generate,
  });
}
