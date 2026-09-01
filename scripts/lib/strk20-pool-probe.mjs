export function contractFunctions(rawAbi) {
  const abi = typeof rawAbi === "string" ? JSON.parse(rawAbi) : rawAbi;
  if (!Array.isArray(abi)) throw new Error("Pool ABI is not an array");
  return abi.flatMap((entry) => {
    if (entry.type === "function") return [entry];
    if (entry.type === "interface" && Array.isArray(entry.items)) {
      return entry.items.filter((item) => item.type === "function");
    }
    return [];
  });
}

export function classifyPoolSurface(functions) {
  const applyActions = functions.find((entry) => entry.name === "apply_actions");
  if (!applyActions) throw new Error("Pool ABI has no apply_actions entrypoint");
  const inputTypes = (applyActions.inputs ?? []).map((input) => String(input.type));
  const legacyGlobalScreening = inputTypes.some(
    (type) => type.includes("Option::<") && type.includes("ScreeningAttestation"),
  );
  const openNoteScreening = inputTypes.some((type) => type.includes("OpenNoteScreeningPolicy"));
  return {
    applyActionsInputs: inputTypes,
    surface: legacyGlobalScreening
      ? "legacy-global-screening"
      : openNoteScreening
        ? "open-note-screening-policy"
        : "unknown",
    documentedHelperReturn: legacyGlobalScreening ? "Span<OpenNoteDeposit>" : "unverified",
  };
}

export function formatTokenUnits(value, decimals = 18) {
  const amount = BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const fraction = (amount % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function shortString(value) {
  const hex = BigInt(value).toString(16);
  const padded = hex.length % 2 === 0 ? hex : `0${hex}`;
  return Buffer.from(padded, "hex").toString("utf8");
}
