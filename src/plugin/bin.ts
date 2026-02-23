#!/usr/bin/env node

import { runNodeJs } from "@bufbuild/protoplugin";
import { createExtProtoPlugin } from "./index.js";

runNodeJs(createExtProtoPlugin());
