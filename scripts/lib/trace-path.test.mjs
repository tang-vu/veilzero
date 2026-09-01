import { describe, expect, it } from "vitest";
import { hasNestedCallPath, successfulExecuteInvocation } from "./trace-path.mjs";

const project = "0x333";
const pool = "0x222";

describe("mainnet trace path", () => {
  it("accepts account to pool to project nesting", () => {
    const invocation = { contract_address: "0x111", calls: [{ contract_address: pool, calls: [{ contract_address: project, calls: [] }] }] };
    expect(hasNestedCallPath(invocation, pool, [project])).toBe(true);
  });

  it("accepts deeper project calls and equivalent padded addresses", () => {
    const invocation = { contract_address: "0x1", calls: [{ contract_address: "0x0222", calls: [{ contract_address: "0x999", calls: [{ contract_address: "0x0333" }] }] }] };
    expect(hasNestedCallPath(invocation, pool, [project])).toBe(true);
  });

  it("rejects pool and project calls that are siblings", () => {
    const invocation = { contract_address: "0x111", calls: [{ contract_address: pool }, { contract_address: project }] };
    expect(hasNestedCallPath(invocation, pool, [project])).toBe(false);
  });

  it("rejects the reverse project-to-pool direction and malformed nodes", () => {
    expect(hasNestedCallPath({ contract_address: project, calls: [{ contract_address: pool }] }, pool, [project])).toBe(false);
    expect(hasNestedCallPath(null, pool, [project])).toBe(false);
    expect(hasNestedCallPath({ contract_address: pool }, pool, [])).toBe(false);
  });

  it("rejects reverted or missing execute invocations", () => {
    expect(successfulExecuteInvocation({ execute_invocation: { contract_address: "0x1", calls: [] } })).not.toBeNull();
    expect(successfulExecuteInvocation({ execute_invocation: { revert_reason: "failed" } })).toBeNull();
    expect(successfulExecuteInvocation({})).toBeNull();
  });
});
