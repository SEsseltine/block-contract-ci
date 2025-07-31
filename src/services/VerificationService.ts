import * as core from '@actions/core';
import * as exec from '@actions/exec';

export class VerificationService {
  constructor(private etherscanApiKey?: string) {}

  async verifyContract(
    contractAddress: string,
    network: string,
    constructorArgs?: string[]
  ): Promise<boolean> {
    if (!this.etherscanApiKey) {
      core.warning('No Etherscan API key provided, skipping verification');
      return false;
    }

    try {
      core.info(`Verifying contract ${contractAddress} on ${network}`);

      const args = [
        'verify-contract',
        contractAddress,
        '--etherscan-api-key', this.etherscanApiKey,
        '--chain', this.getChainName(network)
      ];

      if (constructorArgs && constructorArgs.length > 0) {
        args.push('--constructor-args', constructorArgs.join(' '));
      }

      let output = '';
      let error = '';

      const exitCode = await exec.exec('forge', args, {
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString();
          },
          stderr: (data: Buffer) => {
            error += data.toString();
          }
        }
      });

      if (exitCode === 0) {
        core.info('Contract verification successful');
        return true;
      } else {
        core.warning(`Contract verification failed: ${error}`);
        return false;
      }

    } catch (error) {
      core.warning(`Contract verification error: ${error}`);
      return false;
    }
  }

  private getChainName(network: string): string {
    const chainMap: { [key: string]: string } = {
      'mainnet': 'mainnet',
      'sepolia': 'sepolia',
      'goerli': 'goerli',
      'polygon': 'polygon',
      'polygon-mumbai': 'polygon-mumbai',
      'arbitrum': 'arbitrum',
      'arbitrum-sepolia': 'arbitrum-sepolia',
      'optimism': 'optimism',
      'optimism-sepolia': 'optimism-sepolia',
      'base': 'base',
      'base-sepolia': 'base-sepolia'
    };

    return chainMap[network.toLowerCase()] || network;
  }
}