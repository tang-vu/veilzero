import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hash } from "starknet";

const artifacts = {
  sierra: {
    path: "contracts/target/dev/veilzero_protocol_VeilZero.contract_class.json",
    sha256: "b13014c00ee0e65831e50a2c46611c3f3d9e6ece41236117c7eef0bb1a2d852b",
    classHash: "0x06b410a4ce4494e79a34998957952d1502eb803fb2e15589021eaf0178b5cb56",
  },
  casm: {
    path: "contracts/target/dev/veilzero_protocol_VeilZero.compiled_contract_class.json",
    sha256: "8abe0cc92302c14b6e48069cb2f6956d6e84f03df82131d6fad4f16b73d1ec53",
    classHash: "0x0264bccfb4ff096e2de7b087ffec2a89fbd77c73ac360100bbe724a51cfabeed",
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
