import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import { ForgeDeployOutput } from '../types';

export class ForgeRunner {
  constructor(private projectRoot: string) {}

  async runDeployScript(
    scriptPath: string,
    rpcUrl: string,
    privateKey: string,
    broadcast: boolean = true,
    gasLimit: string = '3000000'
  ): Promise<ForgeDeployOutput> {
    core.info(`Running Forge script: ${scriptPath}`);
    
    const args = [
      'script',
      scriptPath,
      '--rpc-url', rpcUrl,
      '--private-key', privateKey,
      '--gas-limit', gasLimit,
      '--json'
    ];

    if (broadcast) {
      args.push('--broadcast');
    }

    let output = '';
    let error = '';

    const exitCode = await exec.exec('forge', args, {
      cwd: this.projectRoot,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          error += data.toString();
        }
      }
    });

    if (exitCode !== 0) {
      throw new Error(`Forge script failed: ${error}`);
    }

    return this.parseForgeOutput(output);
  }

  async installDependencies(): Promise<void> {
    core.info('Installing Forge dependencies...');
    
    const exitCode = await exec.exec('forge', ['install'], {
      cwd: this.projectRoot
    });

    if (exitCode !== 0) {
      throw new Error('Failed to install Forge dependencies');
    }
  }

  async build(): Promise<void> {
    core.info('Building contracts with Forge...');
    
    const exitCode = await exec.exec('forge', ['build'], {
      cwd: this.projectRoot
    });

    if (exitCode !== 0) {
      throw new Error('Forge build failed');
    }
  }

  async test(): Promise<void> {
    core.info('Running tests with Forge...');
    
    const exitCode = await exec.exec('forge', ['test'], {
      cwd: this.projectRoot
    });

    if (exitCode !== 0) {
      throw new Error('Tests failed');
    }
  }

  private parseForgeOutput(output: string): ForgeDeployOutput {
    const logs = output.split('\n').filter(line => line.trim());
    const result: ForgeDeployOutput = { logs };

    // Parse JSON output from forge script
    for (const line of logs) {
      try {
        const parsed = JSON.parse(line);
        
        // Look for transaction receipts
        if (parsed.transactionType === 'CREATE' && parsed.contractAddress) {
          result.contractAddress = parsed.contractAddress;
          result.transactionHash = parsed.transactionHash;
          result.gasUsed = BigInt(parsed.gasUsed || 0);
        }
        
        // Look for deployment events
        if (parsed.type === 'deployment' && parsed.address) {
          result.contractAddress = parsed.address;
        }
      } catch {
        // Line is not JSON, check for contract address patterns
        const addressMatch = line.match(/Contract deployed at: (0x[a-fA-F0-9]{40})/);
        if (addressMatch) {
          result.contractAddress = addressMatch[1];
        }
        
        const txHashMatch = line.match(/Transaction hash: (0x[a-fA-F0-9]{64})/);
        if (txHashMatch) {
          result.transactionHash = txHashMatch[1];
        }
      }
    }

    return result;
  }
}