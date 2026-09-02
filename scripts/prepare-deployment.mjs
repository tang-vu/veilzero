import { readFile } from "node:fs/promises";
import { hash } from "starknet";
import { buildDeploymentPlan } from "./lib/deployment-plan.mjs";
import { classifyPoolSurface, contractFunctions, formatTokenUnits } from "./lib/strk20-pool-probe.mjs";

const EXPECTED = {
  sierraPath: "contracts/target/dev/veilzero_protocol_VeilZero.contract_class.json",
  casmPath: "contracts/target/dev/veilzero_protocol_VeilZero.compiled_contract_class.json",
  classHash: "0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503",
  compiledClassHash: "0x006bea38144dd691e99894a0f603823c29f33d3c4013abecd2999c67a2391b78",
};
const rpcUrl = process.env.STARKNET_RPC_URL;
const poolAddress = process.env.STRK20_POOL_ADDRESS;
const deployerAddress = process.env.VEILZERO_DEPLOYER_ADDRESS;
if (!rpcUrl) throw new Error("STARKNET_RPC_URL is required and is never printed");
if (!poolAddress) throw new Error("STRK20_POOL_ADDRESS is required");

async function loadJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error(`${path} is missing; run the documented Scarb build first`);
    throw error;
  }
}

const [sierra, casm] = await Promise.all([loadJson(EXPECTED.sierraPath), loadJson(EXPECTED.casmPath)]);
const classHash = `0x${BigInt(hash.computeSierraContractClassHash(sierra)).toString(16).padStart(64, "0")}`;
const compiledClassHash = `0x${BigInt(hash.computeCompiledClassHash(casm)).toString(16).padStart(64, "0")}`;
if (classHash !== EXPECTED.classHash || compiledClassHash !== EXPECTED.compiledClassHash) {
  throw new Error("Built artifact identity differs from the pinned release candidate");
}

let requestId = 0;
async function rpc(method, params, allowError = false) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }),
  });
  if (!response.ok) throw new Error(`${method} returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error && !allowError) throw new Error(`${method}: ${payload.error.message}`);
  return payload;
}

const blockNumber = (await rpc("starknet_blockNumber", [])).result;
const blockId = { block_number: blockNumber };
const [chain, block, poolClass, poolClassHash, udcClass, declaration] = await Promise.all([
  rpc("starknet_chainId", []),
  rpc("starknet_getBlockWithTxHashes", [blockId]),
  rpc("starknet_getClassAt", [blockId, poolAddress]),
  rpc("starknet_getClassHashAt", [blockId, poolAddress]),
  rpc("starknet_getClassHashAt", [blockId, "0x02ceed65a4bd731034c01113685c831b01c15d7d432f71afb1cf1634b53a2125"]),
  rpc("starknet_getClass", [blockId, classHash], true),
]);
const functions = contractFunctions(poolClass.result.abi);
const surface = classifyPoolSurface(functions);
if (surface.surface !== "legacy-global-screening") {
  throw new Error(`Pool surface ${surface.surface} is not compatible with this release artifact`);
}
const names = new Set(functions.map((entry) => entry.name));
if (!names.has("get_fee_amount")) throw new Error("Pool has no get_fee_amount view");
const fee = await rpc("starknet_call", [
  {
    contract_address: poolAddress,
    entry_point_selector: hash.getSelectorFromName("get_fee_amount"),
    calldata: [],
  },
  blockId,
]);
const plan = deployerAddress
  ? buildDeploymentPlan({ classHash, compiledClassHash, poolAddress, deployerAddress })
  : null;
if (declaration.error && declaration.error.code !== 28) {
  throw new Error(`Unable to determine declaration state: ${declaration.error.message}`);
}
const classDeclared = !declaration.error;
if (classDeclared && declaration.result.contract_class_version === undefined) {
  throw new Error("Declared class response has an unexpected shape");
}

console.log(JSON.stringify({
  status: plan ? "READ_ONLY_DEPLOYMENT_PLAN" : "READ_ONLY_DEPLOYMENT_READINESS",
  observedAt: new Date(block.result.timestamp * 1000).toISOString(),
  chainId: chain.result,
  blockNumber,
  blockHash: block.result.block_hash,
  poolClassHash: poolClassHash.result,
  poolSurface: surface.surface,
  poolFeeWei: BigInt(fee.result[0]).toString(),
  poolFeeStrk: formatTokenUnits(fee.result[0]),
  udcClassHash: udcClass.result,
  classDeclared,
  declarationRequired: !classDeclared,
  declarationParameters: {
    compiled_class_hash: compiledClassHash,
    class_hash: classHash,
    contract_class_file: EXPECTED.sierraPath,
  },
  deployerAddressRequired: !plan,
  deployment: plan,
  warning: plan
    ? "No fee was estimated, no wallet was contacted, and no transaction was signed or submitted."
    : "Declaration readiness was checked without a deployer. Set VEILZERO_DEPLOYER_ADDRESS to a public browser-wallet address to derive the exact unique UDC plan; no fee was estimated and no transaction was signed or submitted.",
}, null, 2));
