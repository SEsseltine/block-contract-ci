import * as core from '@actions/core';
import { ethers } from 'ethers';
import { ProxyUpgradeResult } from '../types';

// UUPS Proxy ABI for upgradeToAndCall function
const UUPS_PROXY_ABI = [
  'function upgradeToAndCall(address newImplementation, bytes memory data) external payable',
  'function upgradeTo(address newImplementation) external',
  'function implementation() external view returns (address)',
  'function owner() external view returns (address)'
];

export class ProxyService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(rpcUrl: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async upgradeProxy(
    proxyAddress: string,
    newImplementationAddress: string,
    initData?: string
  ): Promise<ProxyUpgradeResult> {
    try {
      core.info(`Upgrading proxy ${proxyAddress} to implementation ${newImplementationAddress}`);

      const proxy = new ethers.Contract(proxyAddress, UUPS_PROXY_ABI, this.wallet);

      // Verify current implementation
      const currentImpl = await proxy.implementation();
      core.info(`Current implementation: ${currentImpl}`);
      
      if (currentImpl.toLowerCase() === newImplementationAddress.toLowerCase()) {
        throw new Error('New implementation is the same as current implementation');
      }

      // Perform upgrade
      let tx;
      if (initData && initData !== '0x') {
        core.info('Upgrading with initialization data');
        tx = await proxy.upgradeToAndCall(newImplementationAddress, initData);
      } else {
        core.info('Upgrading without initialization data');
        tx = await proxy.upgradeTo(newImplementationAddress);
      }

      core.info(`Upgrade transaction submitted: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      core.info(`Upgrade completed in block ${receipt.blockNumber}`);

      // Verify upgrade was successful
      const newImpl = await proxy.implementation();
      if (newImpl.toLowerCase() !== newImplementationAddress.toLowerCase()) {
        throw new Error('Upgrade verification failed: implementation address mismatch');
      }

      return {
        transactionHash: tx.hash,
        gasUsed: receipt.gasUsed
      };

    } catch (error) {
      throw new Error(`Proxy upgrade failed: ${error}`);
    }
  }

  async getImplementationAddress(proxyAddress: string): Promise<string> {
    try {
      const proxy = new ethers.Contract(proxyAddress, UUPS_PROXY_ABI, this.provider);
      return await proxy.implementation();
    } catch (error) {
      throw new Error(`Failed to get implementation address: ${error}`);
    }
  }

  async validateProxyOwnership(proxyAddress: string): Promise<boolean> {
    try {
      const proxy = new ethers.Contract(proxyAddress, UUPS_PROXY_ABI, this.provider);
      const owner = await proxy.owner();
      const walletAddress = await this.wallet.getAddress();
      
      const isOwner = owner.toLowerCase() === walletAddress.toLowerCase();
      if (!isOwner) {
        core.warning(`Wallet ${walletAddress} is not the owner of proxy ${proxyAddress}. Owner is: ${owner}`);
      }
      
      return isOwner;
    } catch (error) {
      core.warning(`Could not verify proxy ownership: ${error}`);
      return false;
    }
  }
}