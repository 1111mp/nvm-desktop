import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { appPath, appNodeModulesPath } from "./paths.mjs";
import packageJson from "../release/app/package.json" assert { type: "json" };

const { dependencies } = packageJson;

if (Object.keys(dependencies || {}).length > 0 && existsSync(appNodeModulesPath)) {
  const electronRebuildCmd =
    "../node_modules/.bin/electron-rebuild --force --types prod,dev,optional --module-dir .";
  const cmd =
    process.platform === "win32" ? electronRebuildCmd.replace(/\//g, "\\") : electronRebuildCmd;
  execSync(cmd, {
    cwd: appPath,
    stdio: "inherit"
  });
}
