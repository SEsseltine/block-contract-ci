import { ForgeDeployOutput } from '../types';
export declare class ForgeRunner {
    private projectRoot;
    constructor(projectRoot: string);
    runDeployScript(scriptPath: string, rpcUrl: string, privateKey: string, broadcast?: boolean, gasLimit?: string, proxyAddress?: string, verify?: boolean, etherscanApiKey?: string): Promise<ForgeDeployOutput>;
    installDependencies(): Promise<void>;
    build(): Promise<void>;
    test(): Promise<void>;
    private parseForgeOutput;
}
//# sourceMappingURL=ForgeRunner.d.ts.map