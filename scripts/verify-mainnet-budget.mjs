import { readFile } from "node:fs/promises";
import { verifyMainnetBudget } from "./lib/mainnet-budget.mjs";

const budget = JSON.parse(await readFile(new URL("../mainnet-budget.json", import.meta.url), "utf8"));
const requireReady = process.argv.includes("--require-ready");
try {
  const requireItemIndex = process.argv.indexOf("--require-item");
  const requireItem = requireItemIndex === -1 ? null : process.argv[requireItemIndex + 1];
  if (requireItemIndex !== -1 && !requireItem) throw new Error("Pass the budget item ID after --require-item");
  const result = verifyMainnetBudget(budget, { requireReady, requireItem });
  console.log(
    `Mainnet budget valid${requireItem ? ` for ${requireItem}` : ""}: ${result.totalStrk} STRK known, ${result.maximumExposureStrk} STRK maximum exposure, ${result.maximumHeadroomStrk} STRK ceiling headroom, ${result.missingEstimates.length} estimate(s) pending.`,
  );
} catch (error) {
  console.error(`Mainnet budget invalid: ${error instanceof Error ? error.message : "unknown validation error"}`);
  process.exitCode = 1;
}
