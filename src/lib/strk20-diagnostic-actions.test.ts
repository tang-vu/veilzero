import { describe, expect, it } from "vitest";
import {
  buildPrivateSelfTransferDiagnostic,
  buildPrivateTransferDiagnostic,
  buildShieldDiagnostic,
  buildUnshieldDiagnostic,
  parseTokenAmount,
} from "./strk20-diagnostic-actions";

describe("STRK20 diagnostic actions", () => {
  it("converts token decimals exactly without floating point", () => {
    expect(parseTokenAmount("1.2345")).toBe("0x1121d33597384000");
    expect(parseTokenAmount("0.000001", 6)).toBe("0x1");
    expect(parseTokenAmount("10", 0)).toBe("0xa");
  });

  it("rejects zero, exponent, excess precision and invalid decimals", () => {
    expect(() => parseTokenAmount("0")).toThrow("felt range");
    expect(() => parseTokenAmount("1e3")).toThrow("plain positive decimal");
    expect(() => parseTokenAmount("0.0000001", 6)).toThrow("more than 6");
    expect(() => parseTokenAmount("1", 31)).toThrow("between 0 and 30");
  });

  it("builds a fixed-amount shield action", () => {
    expect(buildShieldDiagnostic({ token: "0x123", amount: "0.5" })).toEqual([
      { type: "deposit", token: "0x123", amount: "0x6f05b59d3b20000" },
    ]);
  });

  it("builds transfer and self-transfer actions without OPEN amounts", () => {
    expect(buildPrivateTransferDiagnostic({ token: "0x123", amount: "2", decimals: 6, recipient: "0x456" })).toEqual([
      { type: "transfer", token: "0x123", amount: "0x1e8480", recipient: "0x456" },
    ]);
    expect(buildPrivateSelfTransferDiagnostic({ token: "0x123", amount: "2", decimals: 6 }, "0x789")[0]).toMatchObject({
      type: "transfer", amount: "0x1e8480", recipient: "0x789",
    });
  });

  it("builds a fixed-amount unshield action and rejects zero recipients", () => {
    expect(buildUnshieldDiagnostic({ token: "0x123", amount: "3", decimals: 6, recipient: "0x456" })).toEqual([
      { type: "withdraw", token: "0x123", amount: "0x2dc6c0", recipient: "0x456" },
    ]);
    expect(() => buildUnshieldDiagnostic({ token: "0x123", amount: "3", recipient: "0x0" })).toThrow("non-zero Starknet address");
  });
});
