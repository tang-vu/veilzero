import { describe, expect, it, vi } from "vitest";
import {
  loadPendingTransaction,
  reconcilePendingTransaction,
  recordPendingTransaction,
  transactionJournalKey,
  type JournalStorage,
} from "./transaction-journal";

function memoryStorage(): JournalStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

const pending = {
  version: 1 as const,
  transactionHash: "0xabc",
  network: "mainnet" as const,
  action: "submit-case" as const,
  contractAddress: "0x123",
  submittedAt: "2026-09-01T12:00:00.000Z",
};

describe("transaction journal", () => {
  it("restores only a secret-free pending transaction after reload", () => {
    const storage = memoryStorage();
    recordPendingTransaction(storage, pending);
    expect(loadPendingTransaction(storage)).toEqual(pending);
    const serialized = storage.values.get(transactionJournalKey)!;
    expect(serialized).not.toMatch(/secret|proof|private|calldata/i);
  });

  it("blocks a second hash until the first is reconciled", () => {
    const storage = memoryStorage();
    recordPendingTransaction(storage, pending);
    expect(() => recordPendingTransaction(storage, { ...pending, transactionHash: "0xdef" })).toThrow("unresolved transaction");
    expect(() => recordPendingTransaction(storage, pending)).not.toThrow();
  });

  it("keeps timeouts and invalid RPC responses ambiguous", async () => {
    const storage = memoryStorage();
    recordPendingTransaction(storage, pending);
    expect((await reconcilePendingTransaction(storage, vi.fn().mockRejectedValue(new Error("timeout")))).state).toBe("ambiguous");
    expect((await reconcilePendingTransaction(storage, vi.fn().mockResolvedValue(null))).state).toBe("ambiguous");
    expect((await reconcilePendingTransaction(storage, vi.fn().mockResolvedValue({
      execution_status: "SUCCEEDED", finality_status: "ACCEPTED_ON_L2",
    }))).state).toBe("ambiguous");
    expect(loadPendingTransaction(storage)).toEqual(pending);
  });

  it("rejects a mismatched receipt hash without clearing the journal", async () => {
    const storage = memoryStorage();
    recordPendingTransaction(storage, pending);
    const result = await reconcilePendingTransaction(storage, vi.fn().mockResolvedValue({
      transaction_hash: "0xdef", execution_status: "SUCCEEDED", finality_status: "ACCEPTED_ON_L2",
    }));
    expect(result).toMatchObject({ state: "ambiguous", receipt: null });
    expect(loadPendingTransaction(storage)).not.toBeNull();
  });

  it("clears only terminal accepted or reverted receipts", async () => {
    const storage = memoryStorage();
    recordPendingTransaction(storage, pending);
    expect((await reconcilePendingTransaction(storage, vi.fn().mockResolvedValue({
      transaction_hash: "0xabc", execution_status: "SUCCEEDED", finality_status: "ACCEPTED_ON_L2",
    }))).state).toBe("accepted");
    expect(loadPendingTransaction(storage)).toBeNull();

    recordPendingTransaction(storage, pending);
    expect((await reconcilePendingTransaction(storage, vi.fn().mockResolvedValue({
      transaction_hash: "0xabc", execution_status: "REVERTED", finality_status: "ACCEPTED_ON_L2",
    }))).state).toBe("failed");
    expect(loadPendingTransaction(storage)).toBeNull();
  });

  it("deletes malformed storage rather than trusting it", () => {
    const storage = memoryStorage();
    storage.setItem(transactionJournalKey, JSON.stringify({ ...pending, claimSecret: "0xdead" }));
    expect(loadPendingTransaction(storage)).toBeNull();
    expect(storage.values.has(transactionJournalKey)).toBe(false);
  });
});
