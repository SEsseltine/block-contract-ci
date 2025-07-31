import { ForgeRunner } from '../forge/ForgeRunner';
import { ActionInputs, DeploymentResult } from '../types';
export declare class DeploymentService {
    private forgeRunner;
    constructor(forgeRunner: ForgeRunner);
    deploy(inputs: ActionInputs): Promise<DeploymentResult>;
}
//# sourceMappingURL=DeploymentService.d.ts.map