import { describe, expect, it } from "vitest";
import { canSubmit, classifyReceipt, redact, renderFee } from "./transaction-safety";

describe("transaction safety", () => {
  it("accepts only final successful receipts", () => expect(classifyReceipt({ transaction_hash: "0x1", execution_status: "SUCCEEDED", finality_status: "ACCEPTED_ON_L2" })).toBe("accepted"));
  it("marks missing and invalid RPC results ambiguous", () => { expect(classifyReceipt(null)).toBe("ambiguous"); expect(classifyReceipt({})).toBe("ambiguous"); });
  it("marks reverted receipts failed", () => expect(classifyReceipt({ execution_status: "REVERTED" })).toBe("failed"));
  it("does not enable duplicate press while pending", () => { expect(canSubmit("awaiting-signature")).toBe(false); expect(canSubmit("submitted")).toBe(false); expect(canSubmit("ambiguous")).toBe(false); });
  it("allows safe retry after explicit rejection", () => expect(canSubmit("rejected")).toBe(true));
  it("renders fees without floating point", () => expect(renderFee(BigInt("1234500000000000000"))).toBe("1.2345 STRK"));
  it("redacts sensitive nested fields", () => expect(redact({ caseSecret: "x", nested: { viewingKey: "y" }, ok: "z" })).toEqual({ caseSecret: "[REDACTED]", nested: { viewingKey: "[REDACTED]" }, ok: "z" }));
});
