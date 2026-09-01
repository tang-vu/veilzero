import { describe, expect, it } from "vitest";
import { classifyChainId, safeWalletError } from "./wallet-diagnostics";

describe("wallet diagnostics", () => {
  it("recognizes Starknet mainnet and Sepolia IDs", () => {
    expect(classifyChainId("SN_MAIN")).toBe("mainnet");
    expect(classifyChainId("0x534e5f5345504f4c4941")).toBe("sepolia");
  });

  it("rejects unknown networks", () => {
    expect(classifyChainId("SN_GOERLI")).toBe("unsupported");
    expect(classifyChainId("")).toBe("unsupported");
  });

  it("does not expose arbitrary wallet error messages", () => {
    expect(safeWalletError({ code: "USER_REFUSED_OP", message: "secret" })).toContain("USER_REFUSED_OP");
    expect(safeWalletError(new Error("account 0xprivate"))).not.toContain("0xprivate");
  });
});
