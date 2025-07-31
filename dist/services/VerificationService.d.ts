export declare class VerificationService {
    private etherscanApiKey?;
    constructor(etherscanApiKey?: string | undefined);
    verifyContract(contractAddress: string, network: string, constructorArgs?: string[]): Promise<boolean>;
    private getChainName;
}
//# sourceMappingURL=VerificationService.d.ts.map