import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const signatures = [
  [0xfffd],
  [0x00c3],
  [0x00c2],
  [0x00e2, 0x20ac],
  [0x00f0, 0x0178],
].map((points) => String.fromCodePoint(...points));

const findings = [];
for (const path of tracked) {
  const bytes = readFileSync(path);
  if (bytes.includes(0)) continue;
  const text = bytes.toString("utf8");
  const signature = signatures.find((candidate) => text.includes(candidate));
  if (signature) findings.push(`${path}: suspicious UTF-8 mojibake sequence U+${[...signature].map((character) => character.codePointAt(0).toString(16).toUpperCase()).join(" U+")}`);
}

if (findings.length) {
  console.error("Text encoding scan failed:\n" + findings.join("\n"));
  process.exit(1);
}

console.log(`Text encoding scan passed across ${tracked.length} tracked files.`);
