import { describe, expect, it } from "vitest";
import { parseStrkUnits, verifyMainnetBudget } from "./mainnet-budget.mjs";

const ids = [
  "deployer-account-activation-network", "declare-class-network", "deploy-contract-network",
  "create-program-network", "program-reserve-principal-strk-equivalent", "fund-program-network",
  "submit-case-protocol-fee", "submit-case-network", "acknowledge-case-network",
  "accept-case-network", "authorize-reward-network", "clarify-case-protocol-fee",
  "clarify-case-network", "claim-reward-protocol-fee", "claim-reward-network",
];
function fixture() {
  return {
    version: 1,
    ceilingStrk: "100",
    items: ids.map((id) => ({
      id,
      state: id.endsWith("protocol-fee") ? "projected" : "awaiting-wallet-estimate",
      amountStrk: id.endsWith("protocol-fee") ? "6" : null,
      transactionHash: null,
      source: "A sufficiently specific wallet or block-pinned evidence source.",
    })),
  };
}

describe("mainnet budget gate", () => {
  it("parses STRK amounts without floating point", () => {
    expect(parseStrkUnits("1.000000000000000001")).toBe(1_000_000_000_000_000_001n);
    expect(() => parseStrkUnits("1e2")).toThrow(/plain decimal/);
    expect(() => parseStrkUnits("0.0000000000000000001")).toThrow(/plain decimal/);
  });

  it("reports an honest incomplete gate while counting known fees", () => {
    const result = verifyMainnetBudget(fixture());
    expect(result).toMatchObject({ ready: false, actualStrk: "0", projectedStrk: "18", totalStrk: "18", remainingStrk: "82" });
    expect(result.missingEstimates).toHaveLength(12);
    expect(() => verifyMainnetBudget(fixture(), { requireReady: true })).toThrow(/missing estimates/);
  });

  it("passes only after every required estimate is explicit and remains below the ceiling", () => {
    const budget = fixture();
    budget.items = budget.items.map((item) => item.state === "awaiting-wallet-estimate"
      ? { ...item, state: "projected", amountStrk: "1" }
      : item);
    expect(verifyMainnetBudget(budget, { requireReady: true })).toMatchObject({ ready: true, totalStrk: "30", remainingStrk: "70" });
  });

  it("rejects cap changes, omitted items, duplicates and unknown fields", () => {
    expect(() => verifyMainnetBudget({ ...fixture(), ceilingStrk: "101" })).toThrow(/exactly 100/);
    expect(() => verifyMainnetBudget({ ...fixture(), items: fixture().items.slice(1) })).toThrow(/exactly 15/);
    const duplicate = fixture(); duplicate.items[1] = { ...duplicate.items[0] };
    expect(() => verifyMainnetBudget(duplicate)).toThrow(/Duplicate/);
    expect(() => verifyMainnetBudget({ ...fixture(), note: "unsafe extension" })).toThrow(/fields must be exactly/);
  });

  it("rejects a ceiling breach and unverified actual costs", () => {
    const breached = fixture();
    breached.items[0] = { ...breached.items[0], state: "projected", amountStrk: "82" };
    expect(() => verifyMainnetBudget(breached)).toThrow(/not below 100/);
    const actual = fixture();
    actual.items[0] = { ...actual.items[0], state: "actual", amountStrk: "1", transactionHash: null };
    expect(() => verifyMainnetBudget(actual)).toThrow(/requires a transaction hash/);
  });
});
