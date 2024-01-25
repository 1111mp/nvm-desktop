import { existsSync, symlinkSync } from "node:fs";
import { appNodeModulesPath, srcNodeModulesPath } from "./paths.mjs";

if (!existsSync(srcNodeModulesPath) && existsSync(appNodeModulesPath)) {
  symlinkSync(appNodeModulesPath, srcNodeModulesPath, "junction");
}
