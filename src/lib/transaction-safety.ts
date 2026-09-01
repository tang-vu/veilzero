export type TxState = "idle" | "awaiting-signature" | "submitted" | "accepted" | "rejected" | "failed" | "ambiguous";
export type ReceiptLike = { execution_status?: string; finality_status?: string; transaction_hash?: string };

export function classifyReceipt(receipt: ReceiptLike | null): TxState {
  if (!receipt) return "ambiguous";
  if (receipt.execution_status === "REVERTED") return "failed";
  if (receipt.execution_status === "SUCCEEDED" && receipt.finality_status?.includes("ACCEPTED")) return "accepted";
  if (receipt.transaction_hash) return "submitted";
  return "ambiguous";
}

export function canSubmit(state: TxState) { return state === "idle" || state === "rejected" || state === "failed"; }
export function renderFee(amount: bigint, decimals = 18, symbol = "STRK") {
  if (decimals < 0 || decimals > 30) throw new Error("Invalid token decimals");
  const base = BigInt(10) ** BigInt(decimals); const whole = amount / base; const fraction = (amount % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""} ${symbol}`;
}
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => /secret|private|plaintext|viewing|seed|proof|recovery/i.test(key) ? [key, "[REDACTED]"] : [key, redact(item)]));
}
