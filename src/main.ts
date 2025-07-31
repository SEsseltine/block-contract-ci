import * as core from '@actions/core';
import { DeploymentService } from './services/DeploymentService';
import { ForgeRunner } from './forge/ForgeRunner';
import { ProxyService } from './services/ProxyService';
import { VerificationService } from './services/VerificationService';
import { ActionInputs, DeploymentResult } from './types';

export async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    core.info(`Starting deployment for network: ${inputs.network}`);

    // Initialize services
    const forgeRunner = new ForgeRunner(inputs.forgeProjectRoot);
    const deploymentService = new DeploymentService(forgeRunner);
    const proxyService = new ProxyService(inputs.rpcUrl, inputs.privateKey);
    const verificationService = new VerificationService(inputs.etherscanApiKey);

    let result: DeploymentResult;

    if (inputs.proxyAddress) {
      // Upgrade existing proxy
      core.info(`Upgrading existing proxy at ${inputs.proxyAddress}`);
      
      // Deploy only the implementation
      const deployResult = await deploymentService.deploy(inputs);
      
      if (!deployResult.implementationAddress) {
        throw new Error('Failed to deploy implementation contract');
      }
      
      // Upgrade the proxy
      const upgradeResult = await proxyService.upgradeProxy(
        inputs.proxyAddress,
        deployResult.implementationAddress
      );
      
      result = {
        implementationAddress: deployResult.implementationAddress,
        proxyAddress: inputs.proxyAddress,
        transactionHash: upgradeResult.transactionHash,
        gasUsed: upgradeResult.gasUsed,
        verified: false
      };
      
      core.info(`Proxy upgrade completed. Implementation: ${result.implementationAddress}`);
    } else {
      // Deploy new proxy and implementation
      core.info('Deploying new proxy and implementation');
      result = await deploymentService.deploy(inputs);
    }

    // Verify contracts if requested
    if (inputs.verifyContracts && inputs.etherscanApiKey && result.implementationAddress) {
      core.info('Verifying contracts...');
      result.verified = await verificationService.verifyContract(
        result.implementationAddress,
        inputs.network
      );
    }

    // Set outputs
    setOutputs(result);
    core.info('Deployment completed successfully');

  } catch (error) {
    throw new Error(`Deployment failed: ${error}`);
  }
}

function getInputs(): ActionInputs {
  return {
    network: core.getInput('network', { required: true }),
    rpcUrl: core.getInput('rpc-url', { required: true }),
    privateKey: core.getInput('private-key', { required: true }),
    deployScript: core.getInput('deploy-script', { required: true }),
    forgeProjectRoot: core.getInput('forge-project-root') || '.',
    proxyAddress: core.getInput('proxy-address') || undefined,
    verifyContracts: core.getBooleanInput('verify-contracts'),
    etherscanApiKey: core.getInput('etherscan-api-key') || undefined,
    gasLimit: core.getInput('gas-limit') || '3000000',
    broadcast: core.getBooleanInput('broadcast')
  };
}

function setOutputs(result: DeploymentResult): void {
  if (result.implementationAddress) {
    core.setOutput('implementation-address', result.implementationAddress);
  }
  if (result.proxyAddress) {
    core.setOutput('proxy-address', result.proxyAddress);
  }
  if (result.transactionHash) {
    core.setOutput('transaction-hash', result.transactionHash);
  }
  if (result.gasUsed) {
    core.setOutput('gas-used', result.gasUsed.toString());
  }
  core.setOutput('verified', result.verified?.toString() || 'false');
}