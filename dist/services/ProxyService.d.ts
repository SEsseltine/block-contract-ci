import { ProxyUpgradeResult } from '../types';
export declare class ProxyService {
    private provider;
    private wallet;
    constructor(rpcUrl: string, privateKey: string);
    upgradeProxy(proxyAddress: string, newImplementationAddress: string, initData?: string): Promise<ProxyUpgradeResult>;
    getImplementationAddress(proxyAddress: string): Promise<string>;
    validateProxyOwnership(proxyAddress: string): Promise<boolean>;
}
//# sourceMappingURL=ProxyService.d.ts.map