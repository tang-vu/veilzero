import { readFile } from "node:fs/promises";

const rpcUrl = process.env.STARKNET_RPC_URL;
const pool = process.env.STRK20_POOL_ADDRESS?.toLowerCase();
if (!rpcUrl) throw new Error("STARKNET_RPC_URL is required (its value is never printed)");
if (!pool || !/^0x[0-9a-f]{1,64}$/.test(pool)) throw new Error("A verified STRK20_POOL_ADDRESS is required; the script never guesses it");
const evidence = JSON.parse(await readFile(new URL("../strk20.json", import.meta.url), "utf8"));
if (!evidence.transactions.length) throw new Error("No transaction hashes to verify");
if (!evidence.contracts.length) throw new Error("No project contract address to verify");
const contracts = new Set(evidence.contracts.map((address) => address.toLowerCase()));

async function rpc(method, params) {
  const response = await fetch(rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  if (!response.ok) throw new Error(`${method} HTTP ${response.status}`);
  const payload = await response.json(); if (payload.error) throw new Error(`${method}: ${payload.error.message}`); return payload.result;
}

const chainId = await rpc("starknet_chainId", []);
if (BigInt(chainId) !== BigInt("0x534e5f4d41494e")) throw new Error(`Wrong network: expected SN_MAIN, received ${chainId}`);

for (const hash of evidence.transactions) {
  const receipt = await rpc("starknet_getTransactionReceipt", [hash]);
  if (receipt.execution_status !== "SUCCEEDED") throw new Error(`${hash}: execution is ${receipt.execution_status}`);
  if (!String(receipt.finality_status).includes("ACCEPTED")) throw new Error(`${hash}: finality is ${receipt.finality_status}`);
  const eventAddresses = new Set((receipt.events ?? []).map((event) => String(event.from_address).toLowerCase()));
  if (!eventAddresses.has(pool)) throw new Error(`${hash}: no event emitted by configured live pool`);
  if (![...contracts].some((contract) => eventAddresses.has(contract))) throw new Error(`${hash}: no event emitted by a declared VeilZero contract`);
  console.log(`${hash}: accepted and succeeded; pool + project events present; actual fee ${receipt.actual_fee?.amount ?? "unreported"} ${receipt.actual_fee?.unit ?? "unit-unreported"}`);
}
