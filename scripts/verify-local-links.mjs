import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const repositoryRoot = resolve(".");
const markdownFiles = execFileSync("git", ["ls-files", "-z", "*.md"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const failures = [];
const linkPattern = /!?(?:\[[^\]]*\])\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(linkPattern)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (!rawTarget || rawTarget.startsWith("#") || /^(?:https?:|mailto:)/i.test(rawTarget)) continue;
    const pathPart = rawTarget.split("#", 1)[0];
    let decoded;
    try { decoded = decodeURIComponent(pathPart); }
    catch { failures.push(`${file}: invalid URL encoding in ${rawTarget}`); continue; }
    const target = resolve(dirname(resolve(file)), decoded);
    const escaped = relative(repositoryRoot, target).startsWith("..");
    if (escaped || !existsSync(target)) failures.push(`${file}: missing or out-of-repository target ${rawTarget}`);
  }
}

if (failures.length) {
  console.error("Local Markdown link validation failed:\n" + failures.join("\n"));
  process.exit(1);
}

console.log(`Local Markdown links valid across ${markdownFiles.length} tracked files.`);
