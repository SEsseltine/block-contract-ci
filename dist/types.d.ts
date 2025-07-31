export interface ActionInputs {
    network: string;
    rpcUrl: string;
    privateKey: string;
    deployScript: string;
    forgeProjectRoot: string;
    proxyAddress?: string;
    verifyContracts: boolean;
    etherscanApiKey?: string;
    gasLimit: string;
    broadcast: boolean;
}
export interface DeploymentResult {
    implementationAddress?: string;
    proxyAddress?: string;
    transactionHash?: string;
    gasUsed?: bigint;
    verified?: boolean;
}
export interface ForgeDeployOutput {
    contractAddress?: string;
    transactionHash?: string;
    gasUsed?: bigint;
    logs: string[];
}
export interface ProxyUpgradeResult {
    transactionHash: string;
    gasUsed: bigint;
}
