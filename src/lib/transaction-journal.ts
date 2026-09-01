import { z } from "zod";
import { classifyReceipt, type ReceiptLike, type TxState } from "./transaction-safety";

const STORAGE_KEY = "veilzero:pending-transaction:v1";
const hash = z.string().max(66).regex(/^0x[0-9a-f]{1,64}$/i);
const pendingEntry = z.object({
  version: z.literal(1),
  transactionHash: hash,
  network: z.enum(["mainnet", "sepolia"]),
  action: z.enum(["deploy", "create-program", "fund-program", "submit-case", "acknowledge", "clarify", "decide", "authorize", "claim"]),
  contractAddress: hash.optional(),
  submittedAt: z.iso.datetime(),
}).strict();

export type PendingTransaction = z.infer<typeof pendingEntry>;
export type JournalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadPendingTransaction(storage: JournalStorage): PendingTransaction | null {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return pendingEntry.parse(JSON.parse(raw)); }
  catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function recordPendingTransaction(storage: JournalStorage, rawEntry: unknown): PendingTransaction {
  const entry = pendingEntry.parse(rawEntry);
  const existing = loadPendingTransaction(storage);
  if (existing && BigInt(existing.transactionHash) !== BigInt(entry.transactionHash)) {
    throw new Error("An unresolved transaction already exists; reconcile it before recording another.");
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(entry));
  return entry;
}

export function clearPendingTransaction(storage: JournalStorage): void {
  storage.removeItem(STORAGE_KEY);
}

function sameTransactionHash(left: string, right: string): boolean {
  if (!hash.safeParse(left).success || !hash.safeParse(right).success) return false;
  return BigInt(left) === BigInt(right);
}

export async function reconcilePendingTransaction(
  storage: JournalStorage,
  getReceipt: (transactionHash: string) => Promise<ReceiptLike | null>,
): Promise<{ entry: PendingTransaction | null; state: TxState; receipt: ReceiptLike | null }> {
  const entry = loadPendingTransaction(storage);
  if (!entry) return { entry: null, state: "idle", receipt: null };
  let receipt: ReceiptLike | null;
  try { receipt = await getReceipt(entry.transactionHash); }
  catch { return { entry, state: "ambiguous", receipt: null }; }
  if (!receipt?.transaction_hash || !sameTransactionHash(receipt.transaction_hash, entry.transactionHash)) {
    return { entry, state: "ambiguous", receipt: null };
  }
  const state = classifyReceipt(receipt);
  if (state === "accepted" || state === "failed") clearPendingTransaction(storage);
  return { entry, state, receipt };
}

export const transactionJournalKey = STORAGE_KEY;
