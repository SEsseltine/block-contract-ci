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
    gasLimit: string = '3000000',
    proxyAddress?: string,
    verify: boolean = false,
    etherscanApiKey?: string
  ): Promise<ForgeDeployOutput> {
    core.info(`Running Forge script: ${scriptPath}`);
    
    const args = [
      'script',
      scriptPath,
      '--rpc-url', rpcUrl,
      '--gas-limit', gasLimit,
      '--json'
    ];

    if (broadcast) {
      args.push('--broadcast');
    }

    if (verify && etherscanApiKey) {
      args.push('--verify');
      args.push('--etherscan-api-key', etherscanApiKey);
    }

    let output = '';
    let error = '';

    const exitCode = await exec.exec('forge', args, {
      cwd: this.projectRoot,
      env: {
        ...process.env,
        PRIVATE_KEY: privateKey,
        ...(proxyAddress && { PROXY_ADDRESS: proxyAddress })
      },
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
        const proxyMatch = line.match(/Proxy deployed at: (0x[a-fA-F0-9]{40})/);
        if (proxyMatch) {
          result.contractAddress = proxyMatch[1];
        }
        
        const implementationMatch = line.match(/(?:Implementation|New implementation) deployed at: (0x[a-fA-F0-9]{40})/);
        if (implementationMatch) {
          result.implementationAddress = implementationMatch[1];
        }
        
        const newImplementationMatch = line.match(/New implementation: (0x[a-fA-F0-9]{40})/);
        if (newImplementationMatch) {
          result.implementationAddress = newImplementationMatch[1];
        }
        
        const contractMatch = line.match(/Contract deployed at: (0x[a-fA-F0-9]{40})/);
        if (contractMatch) {
          result.contractAddress = contractMatch[1];
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