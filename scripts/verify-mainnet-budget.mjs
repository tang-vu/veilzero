import { readFile } from "node:fs/promises";
import { verifyMainnetBudget } from "./lib/mainnet-budget.mjs";

const budget = JSON.parse(await readFile(new URL("../mainnet-budget.json", import.meta.url), "utf8"));
const requireReady = process.argv.includes("--require-ready");
try {
  const result = verifyMainnetBudget(budget, { requireReady });
  console.log(
    `Mainnet budget valid: ${result.totalStrk} STRK actual + projected, ${result.remainingStrk} STRK remaining, ${result.missingEstimates.length} estimate(s) missing; gate ${result.ready ? "READY" : "NOT READY"}.`,
  );
} catch (error) {
  console.error(`Mainnet budget invalid: ${error instanceof Error ? error.message : "unknown validation error"}`);
  process.exitCode = 1;
}
