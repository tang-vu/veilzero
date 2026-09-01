import { readFile } from "node:fs/promises";
import { hash as starknetHash } from "starknet";
import { hasNestedCallPath, successfulExecuteInvocation } from "./lib/trace-path.mjs";

const rpcUrl = process.env.STARKNET_RPC_URL;
const pool = process.env.STRK20_POOL_ADDRESS?.toLowerCase();
if (!rpcUrl) throw new Error("STARKNET_RPC_URL is required (its value is never printed)");
if (!pool || !/^0x[0-9a-f]{1,64}$/.test(pool)) throw new Error("A verified STRK20_POOL_ADDRESS is required; the script never guesses it");
const evidence = JSON.parse(await readFile(new URL("../strk20.json", import.meta.url), "utf8"));
if (!evidence.transactions.length) throw new Error("No transaction hashes to verify");
if (!evidence.contracts.length) throw new Error("No project contract address to verify");
const contracts = new Set(evidence.contracts.map((address) => address.toLowerCase()));
const programId = process.env.VEILZERO_PROGRAM_ID;
const caseId = process.env.VEILZERO_CASE_ID;
if (!programId || !/^0x[0-9a-f]{1,64}$/i.test(programId)) throw new Error("VEILZERO_PROGRAM_ID is required");
if (!caseId || !/^0x[0-9a-f]{1,64}$/i.test(caseId)) throw new Error("VEILZERO_CASE_ID is required");
const expected = [
  { event: "CaseSubmitted", statuses: ["0x1"] },
  { event: "ClarificationCommitted", statuses: ["0x1", "0x2"] },
  { event: "RewardSettled", statuses: ["0x5"] },
];
if (evidence.transactions.length !== expected.length) throw new Error(`Expected exactly ${expected.length} qualifying transactions`);

async function rpc(method, params) {
  const response = await fetch(rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  if (!response.ok) throw new Error(`${method} HTTP ${response.status}`);
  const payload = await response.json(); if (payload.error) throw new Error(`${method}: ${payload.error.message}`); return payload.result;
}

const chainId = await rpc("starknet_chainId", []);
if (BigInt(chainId) !== BigInt("0x534e5f4d41494e")) throw new Error(`Wrong network: expected SN_MAIN, received ${chainId}`);

for (const [index, transactionHash] of evidence.transactions.entries()) {
  const receipt = await rpc("starknet_getTransactionReceipt", [transactionHash]);
  if (receipt.execution_status !== "SUCCEEDED") throw new Error(`${transactionHash}: execution is ${receipt.execution_status}`);
  if (!String(receipt.finality_status).includes("ACCEPTED")) throw new Error(`${transactionHash}: finality is ${receipt.finality_status}`);
  const trace = await rpc("starknet_traceTransaction", [transactionHash]);
  const executeInvocation = successfulExecuteInvocation(trace);
  if (!executeInvocation) throw new Error(`${transactionHash}: missing or reverted execute trace`);
  if (!hasNestedCallPath(executeInvocation, pool, [...contracts])) {
    throw new Error(`${transactionHash}: trace does not prove live pool -> VeilZero contract execution`);
  }
  const eventSelector = starknetHash.getSelectorFromName(expected[index].event).toLowerCase();
  const projectEvent = (receipt.events ?? []).find((event) => contracts.has(String(event.from_address).toLowerCase()) && (event.keys ?? []).some((key) => BigInt(key) === BigInt(eventSelector)));
  if (!projectEvent) throw new Error(`${transactionHash}: missing ${expected[index].event} from a declared VeilZero contract`);
  if (!receipt.block_hash) throw new Error(`${transactionHash}: accepted receipt has no block hash`);
  const statusResult = await rpc("starknet_call", [{
    contract_address: projectEvent.from_address,
    entry_point_selector: starknetHash.getSelectorFromName("get_case_status"),
    calldata: [programId, caseId],
  }, { block_hash: receipt.block_hash }]);
  const status = `0x${BigInt(statusResult[0]).toString(16)}`;
  if (!expected[index].statuses.includes(status)) throw new Error(`${transactionHash}: case status ${status} does not match ${expected[index].statuses.join(" or ")}`);
  console.log(`${transactionHash}: ${expected[index].event}; status ${status}; traced pool -> project path; accepted and succeeded; actual fee ${receipt.actual_fee?.amount ?? "unreported"} ${receipt.actual_fee?.unit ?? "unit-unreported"}`);
}
