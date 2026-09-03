const EXPECTED_IDS = [
  "deployer-account-activation-network",
  "declare-class-network",
  "deploy-contract-network",
  "create-program-network",
  "program-reserve-principal-strk-equivalent",
  "fund-program-network",
  "submit-case-protocol-fee",
  "submit-case-network",
  "acknowledge-case-network",
  "accept-case-network",
  "authorize-reward-network",
  "clarify-case-protocol-fee",
  "clarify-case-network",
  "claim-reward-protocol-fee",
  "claim-reward-network",
];
const EXPECTED_ID_SET = new Set(EXPECTED_IDS);
const DECIMAL = /^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,18})?$/;
const TRANSACTION_HASH = /^0x[0-9a-f]{1,64}$/i;

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} fields must be exactly: ${wanted.join(", ")}`);
  }
}

export function parseStrkUnits(value, label = "amountStrk") {
  if (typeof value !== "string" || !DECIMAL.test(value)) throw new Error(`${label} must be a plain decimal string with at most 18 places`);
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0") || "0");
}

export function formatStrkUnits(value) {
  const whole = value / 10n ** 18n;
  const fraction = (value % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function verifyMainnetBudget(raw, { requireReady = false, requireItem = null } = {}) {
  exactKeys(raw, ["version", "ceilingStrk", "items"], "Budget");
  if (raw.version !== 1) throw new Error("Budget version must be 1");
  const ceiling = parseStrkUnits(raw.ceilingStrk, "ceilingStrk");
  if (ceiling !== 100n * 10n ** 18n) throw new Error("Safety ceiling must remain exactly 100 STRK");
  if (!Array.isArray(raw.items) || raw.items.length !== EXPECTED_IDS.length) {
    throw new Error(`Budget must contain exactly ${EXPECTED_IDS.length} required items`);
  }

  const ids = new Set();
  const itemStates = new Map();
  const missingEstimates = [];
  let actual = 0n;
  let projected = 0n;
  let maximumExposure = 0n;
  let limitTotal = 0n;
  for (const [index, item] of raw.items.entries()) {
    exactKeys(item, ["id", "state", "amountStrk", "limitStrk", "transactionHash", "source"], `items[${index}]`);
    if (!EXPECTED_ID_SET.has(item.id)) throw new Error(`Unknown budget item: ${item.id}`);
    if (ids.has(item.id)) throw new Error(`Duplicate budget item: ${item.id}`);
    ids.add(item.id);
    itemStates.set(item.id, item.state);
    if (typeof item.source !== "string" || item.source.length < 8 || item.source.length > 256) throw new Error(`${item.id} requires a bounded evidence source`);
    const limit = parseStrkUnits(item.limitStrk, `${item.id}.limitStrk`);
    limitTotal += limit;

    if (item.state === "awaiting-wallet-estimate") {
      if (item.amountStrk !== null || item.transactionHash !== null) throw new Error(`${item.id} must remain empty while awaiting an estimate`);
      missingEstimates.push(item.id);
      maximumExposure += limit;
      continue;
    }
    if (item.state !== "projected" && item.state !== "actual") throw new Error(`${item.id} has an invalid state`);
    const amount = parseStrkUnits(item.amountStrk, `${item.id}.amountStrk`);
    if (amount > limit) throw new Error(`${item.id} exceeds its ${formatStrkUnits(limit)} STRK item limit`);
    if (item.state === "projected") {
      if (item.transactionHash !== null) throw new Error(`${item.id} cannot attach a transaction hash to a projection`);
      projected += amount;
      maximumExposure += limit;
    } else {
      if (typeof item.transactionHash !== "string" || !TRANSACTION_HASH.test(item.transactionHash)) throw new Error(`${item.id} actual cost requires a transaction hash`);
      actual += amount;
      maximumExposure += amount;
    }
  }
  for (const id of EXPECTED_IDS) if (!ids.has(id)) throw new Error(`Missing budget item: ${id}`);

  const total = actual + projected;
  if (total >= ceiling) throw new Error(`Budget ceiling breached: ${formatStrkUnits(total)} STRK is not below 100 STRK`);
  if (maximumExposure >= ceiling) throw new Error(`Maximum budget exposure breached: ${formatStrkUnits(maximumExposure)} STRK is not below 100 STRK`);
  if (requireItem !== null) {
    if (!EXPECTED_ID_SET.has(requireItem)) throw new Error(`Unknown required budget item: ${requireItem}`);
    if (itemStates.get(requireItem) === "awaiting-wallet-estimate") throw new Error(`${requireItem} still requires a current wallet estimate`);
  }
  if (requireReady && missingEstimates.length) throw new Error(`Budget gate incomplete; missing estimates: ${missingEstimates.join(", ")}`);
  return {
    ready: missingEstimates.length === 0,
    actualStrk: formatStrkUnits(actual),
    projectedStrk: formatStrkUnits(projected),
    totalStrk: formatStrkUnits(total),
    remainingStrk: formatStrkUnits(ceiling - total),
    limitTotalStrk: formatStrkUnits(limitTotal),
    maximumExposureStrk: formatStrkUnits(maximumExposure),
    maximumHeadroomStrk: formatStrkUnits(ceiling - maximumExposure),
    missingEstimates,
  };
}
