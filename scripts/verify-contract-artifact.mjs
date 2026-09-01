import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hash } from "starknet";

const artifacts = {
  sierra: {
    path: "contracts/target/dev/veilzero_protocol_VeilZero.contract_class.json",
    sha256: "7227a982ed374637214f9c73902af5b50b768494e885b3a148f84d5265fc221e",
    classHash: "0x02450ec72f2e622888a3ab378cf4978dcdd717f2e2365b6fea6e70e7f785d269",
  },
  casm: {
    path: "contracts/target/dev/veilzero_protocol_VeilZero.compiled_contract_class.json",
    sha256: "145b57ddad7e4fef1a90d2ab4825f4b008b755b6a19ae66b46727443f3d32397",
    classHash: "0x00008f826a0adefdf8e4455df7013d07fd12c3a63a77062cd5e52eb1b03fbfeb",
  },
};

function normalizeFelt(value) {
  return `0x${BigInt(value).toString(16).padStart(64, "0")}`;
}

async function loadArtifact(name, expected) {
  let bytes;
  try {
    bytes = await readFile(expected.path);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${expected.path} is missing; run the documented Scarb build first`);
    }
    throw error;
  }

  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== expected.sha256) {
    throw new Error(`${name} SHA-256 mismatch: expected ${expected.sha256}, received ${digest}`);
  }

  return JSON.parse(bytes.toString("utf8"));
}

const sierra = await loadArtifact("Sierra artifact", artifacts.sierra);
const casm = await loadArtifact("CASM artifact", artifacts.casm);
const actualSierraHash = normalizeFelt(hash.computeSierraContractClassHash(sierra));
const actualCasmHash = normalizeFelt(hash.computeCompiledClassHash(casm));

if (actualSierraHash !== artifacts.sierra.classHash) {
  throw new Error(`Sierra class hash mismatch: expected ${artifacts.sierra.classHash}, received ${actualSierraHash}`);
}
if (actualCasmHash !== artifacts.casm.classHash) {
  throw new Error(`CASM class hash mismatch: expected ${artifacts.casm.classHash}, received ${actualCasmHash}`);
}

console.log("Contract artifact identity verified:");
console.log(`- Sierra SHA-256: ${artifacts.sierra.sha256}`);
console.log(`- Sierra class hash: ${actualSierraHash}`);
console.log(`- CASM SHA-256: ${artifacts.casm.sha256}`);
console.log(`- CASM class hash: ${actualCasmHash}`);
