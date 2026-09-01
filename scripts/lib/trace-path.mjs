function equalAddress(left, right) {
  try { return BigInt(left) === BigInt(right); } catch { return false; }
}

function children(invocation) {
  return Array.isArray(invocation?.calls) ? invocation.calls : [];
}

function containsAddress(invocation, addresses) {
  if (!invocation || typeof invocation !== "object") return false;
  if (typeof invocation.contract_address === "string" && addresses.some((address) => equalAddress(invocation.contract_address, address))) return true;
  return children(invocation).some((child) => containsAddress(child, addresses));
}

export function hasNestedCallPath(invocation, ancestorAddress, descendantAddresses) {
  if (!invocation || typeof invocation !== "object" || !Array.isArray(descendantAddresses) || descendantAddresses.length === 0) return false;
  if (typeof invocation.contract_address === "string" && equalAddress(invocation.contract_address, ancestorAddress)) {
    return children(invocation).some((child) => containsAddress(child, descendantAddresses));
  }
  return children(invocation).some((child) => hasNestedCallPath(child, ancestorAddress, descendantAddresses));
}

export function successfulExecuteInvocation(trace) {
  const invocation = trace?.execute_invocation;
  if (!invocation || typeof invocation !== "object" || typeof invocation.revert_reason === "string") return null;
  return invocation;
}
