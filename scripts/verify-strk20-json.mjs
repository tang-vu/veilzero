import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../strk20.json", import.meta.url), "utf8"));
const keys = ["transactions", "contracts", "demo_video", "demo_url"];
for (const key of keys) if (!(key in data)) throw new Error(`Missing strk20.json field: ${key}`);
if (!Array.isArray(data.transactions) || !Array.isArray(data.contracts)) throw new Error("transactions and contracts must be arrays");
if (new Set(data.transactions.map((item) => item.toLowerCase())).size !== data.transactions.length) throw new Error("Duplicate transaction hash");
for (const hash of data.transactions) if (!/^0x[0-9a-f]{1,64}$/i.test(hash)) throw new Error(`Invalid transaction hash: ${hash}`);
for (const address of data.contracts) if (!/^0x[0-9a-f]{1,64}$/i.test(address)) throw new Error(`Invalid contract address: ${address}`);
for (const field of ["demo_video", "demo_url"]) if (data[field] && !/^https:\/\//.test(data[field])) throw new Error(`${field} must be HTTPS`);
if (process.argv.includes("--require-complete")) {
  if (data.transactions.length < 3) throw new Error("Submission requires at least three transactions");
  if (!data.demo_video || !data.demo_url) throw new Error("Submission requires demo video and URL");
}
console.log(`strk20.json valid: ${data.transactions.length} transaction(s), ${data.contracts.length} contract(s), evidence fields ${process.argv.includes("--require-complete") ? "complete" : "allowed to be incomplete"}.`);
