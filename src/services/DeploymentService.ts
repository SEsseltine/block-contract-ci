import * as core from '@actions/core';
import { ForgeRunner } from '../forge/ForgeRunner';
import { ActionInputs, DeploymentResult } from '../types';

export class DeploymentService {
  constructor(private forgeRunner: ForgeRunner) {}

  async deploy(inputs: ActionInputs): Promise<DeploymentResult> {
    try {
      // Install dependencies and build
      await this.forgeRunner.installDependencies();
      await this.forgeRunner.build();
      
      // Run tests before deployment
      core.info('Running tests before deployment...');
      await this.forgeRunner.test();
      
      // Execute deployment script
      core.info(`Executing deploy script: ${inputs.deployScript}`);
      const forgeOutput = await this.forgeRunner.runDeployScript(
        inputs.deployScript,
        inputs.rpcUrl,
        inputs.privateKey,
        inputs.broadcast,
        inputs.gasLimit,
        inputs.proxyAddress
      );

      const result: DeploymentResult = {
        implementationAddress: forgeOutput.implementationAddress || forgeOutput.contractAddress,
        transactionHash: forgeOutput.transactionHash,
        gasUsed: forgeOutput.gasUsed,
        verified: false
      };

      // If this is a proxy deployment, the contract address becomes the proxy address
      if (!inputs.proxyAddress && forgeOutput.contractAddress) {
        result.proxyAddress = forgeOutput.contractAddress;
      } else if (inputs.proxyAddress) {
        result.proxyAddress = inputs.proxyAddress;
      }

      core.info(`Deployment successful. Contract address: ${result.implementationAddress}`);
      return result;

    } catch (error) {
      throw new Error(`Deployment failed: ${error}`);
    }
  }
}