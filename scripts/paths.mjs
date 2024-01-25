import { dirname, join } from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootPath = join(__dirname, "../"),
  appPath = join(rootPath, "release/app"),
  appNodeModulesPath = join(appPath, "node_modules"),
  srcNodeModulesPath = join(rootPath, "src/node_modules");

export { appPath, appNodeModulesPath, srcNodeModulesPath };
