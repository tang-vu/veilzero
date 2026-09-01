import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const patterns = [
  { name: "private-key block", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "assigned secret", regex: /(?:mnemonic|seed[_ -]?phrase|private[_ -]?key|viewing[_ -]?key|api[_ -]?key|rpc[_ -]?secret)\s*[:=]\s*["'][^"'\r\n]{16,}["']/i },
  { name: "credential-bearing RPC URL", regex: /https?:\/\/[^\s"']*(?:api[_-]?key|token|secret)=[^\s"'&]+/i },
];
const findings = [];
for (const file of files) {
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  for (const pattern of patterns) if (pattern.regex.test(content)) findings.push(`${file}: ${pattern.name}`);
}
if (findings.length) {
  console.error(`Potential committed secret material:\n${findings.join("\n")}`);
  process.exit(1);
}
console.log(`Secret scan passed across ${files.length} tracked files.`);
