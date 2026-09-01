import { hash } from "starknet";
import {
  classifyPoolSurface,
  contractFunctions,
  formatTokenUnits,
  shortString,
} from "./lib/strk20-pool-probe.mjs";

const rpcUrl = process.env.STARKNET_RPC_URL;
const poolAddress = process.env.STRK20_POOL_ADDRESS;
if (!rpcUrl) throw new Error("STARKNET_RPC_URL is required and is never printed");
if (!poolAddress || !/^0x[0-9a-f]{1,64}$/i.test(poolAddress)) {
  throw new Error("A valid STRK20_POOL_ADDRESS is required; the probe never guesses it");
}

let requestId = 0;
async function rpc(method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }),
  });
  if (!response.ok) throw new Error(`${method} returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`${method}: ${payload.error.message}`);
  return payload.result;
}

const blockNumber = await rpc("starknet_blockNumber", []);
const blockId = { block_number: blockNumber };
const [chainId, block, classHash, contractClass] = await Promise.all([
  rpc("starknet_chainId", []),
  rpc("starknet_getBlockWithTxHashes", [blockId]),
  rpc("starknet_getClassHashAt", [blockId, poolAddress]),
  rpc("starknet_getClassAt", [blockId, poolAddress]),
]);
const functions = contractFunctions(contractClass.abi);
const surface = classifyPoolSurface(functions);
const names = new Set(functions.map((entry) => entry.name));

async function callRequired(name) {
  if (!names.has(name)) throw new Error(`Pool ABI has no ${name} view`);
  return rpc("starknet_call", [
    {
      contract_address: poolAddress,
      entry_point_selector: hash.getSelectorFromName(name),
      calldata: [],
    },
    blockId,
  ]);
}

const [fee, collector, validity, version] = await Promise.all([
  callRequired("get_fee_amount"),
  callRequired("get_fee_collector"),
  callRequired("get_proof_validity_blocks"),
  callRequired("get_version"),
]);

const result = {
  observedAt: new Date(block.timestamp * 1000).toISOString(),
  chainId,
  blockNumber,
  blockHash: block.block_hash,
  poolAddress,
  classHash,
  contractVersion: shortString(version[0]),
  feeWei: BigInt(fee[0]).toString(),
  feeStrk: formatTokenUnits(fee[0]),
  feeCollector: collector[0],
  proofValidityBlocks: Number(BigInt(validity[0])),
  ...surface,
};

console.log(JSON.stringify(result, null, 2));
if (surface.surface === "unknown") {
  throw new Error("Pool screening/return surface is unknown; do not deploy against it");
}
