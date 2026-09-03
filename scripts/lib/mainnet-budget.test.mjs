import { describe, expect, it } from "vitest";
import { parseStrkUnits, verifyMainnetBudget } from "./mainnet-budget.mjs";

const ids = [
  "deployer-account-activation-network", "declare-class-network", "deploy-contract-network",
  "create-program-network", "program-reserve-principal-strk-equivalent", "fund-program-network",
  "submit-case-protocol-fee", "submit-case-network", "acknowledge-case-network",
  "accept-case-network", "authorize-reward-network", "clarify-case-protocol-fee",
  "clarify-case-network", "claim-reward-protocol-fee", "claim-reward-network",
];
const limits = ["3", "6", "6", "3", "25", "4", "6", "4", "3", "3", "3", "6", "4", "6", "4"];
function fixture() {
  return {
    version: 1,
    ceilingStrk: "100",
    items: ids.map((id, index) => ({
      id,
      state: id.endsWith("protocol-fee") ? "projected" : "awaiting-wallet-estimate",
      amountStrk: id.endsWith("protocol-fee") ? "6" : null,
      limitStrk: limits[index],
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
    expect(result).toMatchObject({
      ready: false, actualStrk: "0", projectedStrk: "18", totalStrk: "18", remainingStrk: "82",
      limitTotalStrk: "86", maximumExposureStrk: "86", maximumHeadroomStrk: "14",
    });
    expect(result.missingEstimates).toHaveLength(12);
    expect(() => verifyMainnetBudget(fixture(), { requireReady: true })).toThrow(/missing estimates/);
  });

  it("opens only the requested action gate after its current estimate is explicit", () => {
    const budget = fixture();
    expect(() => verifyMainnetBudget(budget, { requireItem: "declare-class-network" })).toThrow(/current wallet estimate/);
    budget.items[1] = { ...budget.items[1], state: "projected", amountStrk: "2" };
    expect(verifyMainnetBudget(budget, { requireItem: "declare-class-network" })).toMatchObject({
      ready: false, totalStrk: "20", maximumExposureStrk: "86",
    });
    expect(() => verifyMainnetBudget(budget, { requireItem: "not-an-item" })).toThrow(/Unknown required/);
  });

  it("passes full readiness only after every required estimate is explicit", () => {
    const budget = fixture();
    budget.items = budget.items.map((item) => item.state === "awaiting-wallet-estimate"
      ? { ...item, state: "projected", amountStrk: "1" }
      : item);
    expect(verifyMainnetBudget(budget, { requireReady: true })).toMatchObject({
      ready: true, totalStrk: "30", remainingStrk: "70", maximumExposureStrk: "86", maximumHeadroomStrk: "14",
    });
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
    breached.items = breached.items.map((item) => ({
      ...item, state: "projected", amountStrk: "7", limitStrk: "7", transactionHash: null,
    }));
    expect(() => verifyMainnetBudget(breached)).toThrow(/not below 100/);
    const actual = fixture();
    actual.items[0] = { ...actual.items[0], state: "actual", amountStrk: "1", transactionHash: null };
    expect(() => verifyMainnetBudget(actual)).toThrow(/requires a transaction hash/);
  });

  it("rejects item-limit and maximum-exposure breaches", () => {
    const itemBreach = fixture();
    itemBreach.items[0] = { ...itemBreach.items[0], state: "projected", amountStrk: "4" };
    expect(() => verifyMainnetBudget(itemBreach)).toThrow(/item limit/);
    const exposureBreach = fixture();
    exposureBreach.items[4] = { ...exposureBreach.items[4], limitStrk: "40" };
    expect(() => verifyMainnetBudget(exposureBreach)).toThrow(/Maximum budget exposure/);
  });
});
