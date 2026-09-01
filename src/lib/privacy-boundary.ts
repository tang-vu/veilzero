export const privacyBoundary = [
  { kind: "hidden", title: "INTENDED TO REMAIN HIDDEN", items: ["Report and follow-up plaintext", "Vendor decryption private key", "Case secret and signing key", "Researcher's unrelated cases", "Shielded recipient linkage where STRK20 provides it"] },
  { kind: "public", title: "PUBLIC BY DESIGN", items: ["Program policy and contract addresses", "Case/action existence and timestamps", "Deadlines and lifecycle status", "One-time claim secret and signature after settlement", "Shield deposit address, token and amount"] },
  { kind: "correlatable", title: "POTENTIALLY CORRELATABLE", items: ["Timing and distinctive action sequences", "Ciphertext size class", "Browser, network and IP metadata", "Repeated amounts and low anonymity sets"] },
] as const;
