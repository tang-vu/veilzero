import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hash } from "starknet";

const artifacts = {
  sierra: {
    path: "contracts/target/dev/veilzero_protocol_VeilZero.contract_class.json",
    sha256: "fd033dfe84634a1c46e6854ade449e5fbaf67f64a79409539cbc1c1819622ca8",
    classHash: "0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503",
  },
  casm: {
    path: "contracts/target/dev/veilzero_protocol_VeilZero.compiled_contract_class.json",
    sha256: "816fc781916a10d441c01fc2f90e2854f55cc94a0201bad982fd2c6d98afcbe9",
    classHash: "0x006bea38144dd691e99894a0f603823c29f33d3c4013abecd2999c67a2391b78",
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
