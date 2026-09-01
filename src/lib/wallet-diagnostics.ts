export type NetworkClassification = "mainnet" | "sepolia" | "unsupported";

const MAINNET_IDS = new Set(["sn_main", "0x534e5f4d41494e"]);
const SEPOLIA_IDS = new Set(["sn_sepolia", "0x534e5f5345504f4c4941"]);

export function classifyChainId(chainId: string): NetworkClassification {
  const normalized = chainId.trim().toLowerCase();
  if (MAINNET_IDS.has(normalized)) return "mainnet";
  if (SEPOLIA_IDS.has(normalized)) return "sepolia";
  return "unsupported";
}

export function safeWalletError(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code: unknown }).code).replace(/[^A-Z0-9_-]/gi, "");
    if (code) return `Wallet returned ${code}. No transaction was submitted.`;
  }
  return "Wallet declined or could not complete the diagnostic. No transaction was submitted.";
}
