import fs from "fs-extra";
import path from "path";

const UPDATE_LOG = "UPDATELOG.md";

// parse the UPDATELOG.md
export async function resolveUpdateLog(tag) {
  const cwd = process.cwd();

  const reTitle = /^## v[\d\.]+/;
  const reEnd = /^---/;

  const file = path.join(cwd, UPDATE_LOG);

  if (!(await fs.pathExists(file))) {
    throw new Error("could not found UPDATELOG.md");
  }

  const data = await fs.readFile(file).then((d) => d.toString("utf8"));

  const map = {};
  let p = "";

  data.split("\n").forEach((line) => {
    if (reTitle.test(line)) {
      p = line.slice(3).trim();
      if (!map[p]) {
        map[p] = [];
      } else {
        throw new Error(`Tag ${p} dup`);
      }
    } else if (reEnd.test(line)) {
      p = "";
    } else if (p) {
      map[p].push(line);
    }
  });

  if (!map[tag]) {
    throw new Error(`could not found "${tag}" in UPDATELOG.md`);
  }

  return map[tag].join("\n").trim();
}
