import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hash } from "starknet";

const artifacts = {
  sierra: {
    path: "contracts/target/dev/veilzero_protocol_VeilZero.contract_class.json",
    sha256: "b7550ab59ac4e3adacf4e51cf3555659ffd906853cf7e410d5a357e40c760040",
    classHash: "0x00fd7a15f456de5ea026ef7464d5c60ac75712f1e3e3f3da455798c0b0156d27",
  },
  casm: {
    path: "contracts/target/dev/veilzero_protocol_VeilZero.compiled_contract_class.json",
    sha256: "5e0a2e3a040f422c63838f7720fc301ae42b1ec2202a2458a9ba772f61525dc2",
    classHash: "0x03006f14cdb03f79ff816465a5a18311df4b5177cadf7df3453b87038b188076",
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
