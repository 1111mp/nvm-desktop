import { join } from "node:path";
import { readJson, writeJson } from "fs-extra";

export async function configrationExport(path: string, output: Nvmd.Configration) {
  const filename = `configration_${Date.now()}.json`;
  await writeJson(join(path, `configration_${Date.now()}.json`), output);
  return filename;
}

export async function configrationImport(path: string) {
  try {
    const input = (await readJson(path)) as Nvmd.Configration;
    return input;
  } catch {
    return {};
  }
}
