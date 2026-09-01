import { describe, expect, it } from "vitest";
import { buildDeploymentPlan, deploymentSalt } from "./deployment-plan.mjs";

const input = {
  classHash: "0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503",
  compiledClassHash: "0x006bea38144dd691e99894a0f603823c29f33d3c4013abecd2999c67a2391b78",
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
