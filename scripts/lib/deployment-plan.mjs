import { defaultDeployer, hash } from "starknet";

const ADDRESS = /^0x[0-9a-f]{1,64}$/i;

function requireAddress(name, value) {
  if (!ADDRESS.test(value)) throw new Error(`${name} must be a Starknet address`);
  return `0x${BigInt(value).toString(16)}`;
}

export function deploymentSalt(classHash, poolAddress) {
  return hash.computePoseidonHashOnElements([
    hash.getSelectorFromName("VEILZERO_DEPLOY_V1"),
    requireAddress("classHash", classHash),
    requireAddress("poolAddress", poolAddress),
  ]);
}

export function buildDeploymentPlan({ classHash, compiledClassHash, poolAddress, deployerAddress }) {
  const normalizedClass = requireAddress("classHash", classHash);
  const normalizedCompiled = requireAddress("compiledClassHash", compiledClassHash);
  const normalizedPool = requireAddress("poolAddress", poolAddress);
  const normalizedDeployer = requireAddress("deployerAddress", deployerAddress);
  const salt = deploymentSalt(normalizedClass, normalizedPool);
  const deployment = defaultDeployer.buildDeployerCall(
    {
      classHash: normalizedClass,
      salt,
      unique: true,
      constructorCalldata: [normalizedPool],
    },
    normalizedDeployer,
  );
  if (deployment.calls.length !== 1 || deployment.addresses.length !== 1) {
    throw new Error("Unexpected UDC deployment shape");
  }
  const call = deployment.calls[0];
  if (BigInt(call.contractAddress) !== BigInt(defaultDeployer.address)) {
    throw new Error("Unexpected UDC deployment target");
  }
  return {
    classHash: normalizedClass,
    compiledClassHash: normalizedCompiled,
    poolAddress: normalizedPool,
    deployerAddress: normalizedDeployer,
    salt,
    unique: true,
    expectedContractAddress: deployment.addresses[0],
    udc: {
      address: defaultDeployer.address,
      entrypoint: defaultDeployer.entryPoint,
    },
    constructorCalldata: [normalizedPool],
    walletInvokeCall: {
      contract_address: defaultDeployer.address,
      entry_point: call.entrypoint,
      calldata: call.calldata,
    },
  };
}
