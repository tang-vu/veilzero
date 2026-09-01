import { describe, expect, it } from "vitest";
import { buildDeploymentPlan, deploymentSalt } from "./deployment-plan.mjs";

const input = {
  classHash: "0x02450ec72f2e622888a3ab378cf4978dcdd717f2e2365b6fea6e70e7f785d269",
  compiledClassHash: "0x00008f826a0adefdf8e4455df7013d07fd12c3a63a77062cd5e52eb1b03fbfeb",
  poolAddress: "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a",
  deployerAddress: "0x123",
};

describe("deployment plan", () => {
  it("builds one wallet-ready unique UDC call bound to the pool", () => {
    const plan = buildDeploymentPlan(input);
    expect(plan.udc).toEqual({
      address: "0x02ceed65a4bd731034c01113685c831b01c15d7d432f71afb1cf1634b53a2125",
      entrypoint: "deploy_contract",
    });
    expect(plan.constructorCalldata).toEqual([`0x${BigInt(input.poolAddress).toString(16)}`]);
    expect(plan.walletInvokeCall.contract_address).toBe(plan.udc.address);
    expect(plan.walletInvokeCall.entry_point).toBe(plan.udc.entrypoint);
    expect(plan.walletInvokeCall.calldata).toHaveLength(5);
    expect(plan.expectedContractAddress).toMatch(/^0x[0-9a-f]+$/);
  });

  it("binds the expected address to the public deployer account", () => {
    const first = buildDeploymentPlan(input);
    const second = buildDeploymentPlan({ ...input, deployerAddress: "0x124" });
    expect(second.expectedContractAddress).not.toBe(first.expectedContractAddress);
    expect(second.salt).toBe(first.salt);
  });

  it("uses a deterministic domain-separated salt and rejects invalid input", () => {
    expect(deploymentSalt(input.classHash, input.poolAddress)).toBe(
      deploymentSalt(input.classHash, input.poolAddress),
    );
    expect(() => buildDeploymentPlan({ ...input, deployerAddress: "not-an-address" })).toThrow(
      "deployerAddress",
    );
  });
});
