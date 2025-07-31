# Smart Contract Deploy Action

A GitHub Action that manages smart contract deployments and upgrades using Forge with automatic UUPS proxy management.

## Features

- 🚀 Deploy smart contracts using Forge scripts
- 🔄 Automatic UUPS proxy upgrades using ERC-1967 standard
- 🔍 Contract verification on block explorers
- 🧪 Automated testing before deployment
- 🌐 Multi-network support
- 📊 Gas usage reporting

## Usage

### Basic Deployment

```yaml
name: Deploy Contracts

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Deploy Contract
        uses: block-contract-ci/smart-contract-deploy@v1
        with:
          network: sepolia
          rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}
          private-key: ${{ secrets.PRIVATE_KEY }}
          deploy-script: script/Deploy.s.sol
          etherscan-api-key: ${{ secrets.ETHERSCAN_API_KEY }}
```

### Proxy Upgrade

```yaml
- name: Upgrade Proxy
  uses: block-contract-ci/smart-contract-deploy@v1
  with:
    network: mainnet
    rpc-url: ${{ secrets.MAINNET_RPC_URL }}
    private-key: ${{ secrets.PRIVATE_KEY }}
    deploy-script: script/DeployV2.s.sol
    proxy-address: "0x1234567890123456789012345678901234567890"
    etherscan-api-key: ${{ secrets.ETHERSCAN_API_KEY }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `network` | Target network (mainnet, sepolia, polygon, etc.) | ✅ | |
| `rpc-url` | RPC URL for the target network | ✅ | |
| `private-key` | Private key for deployment (use secrets) | ✅ | |
| `deploy-script` | Path to Forge deploy script | ✅ | |
| `forge-project-root` | Root directory of the Forge project | | `.` |
| `proxy-address` | Address of existing UUPS proxy to upgrade | | |
| `verify-contracts` | Verify contracts on block explorer | | `true` |
| `etherscan-api-key` | Etherscan API key for verification | | |
| `gas-limit` | Gas limit for transactions | | `3000000` |
| `broadcast` | Whether to broadcast transactions | | `true` |

## Outputs

| Output | Description |
|--------|-------------|
| `implementation-address` | Address of the deployed implementation contract |
| `proxy-address` | Address of the proxy contract |
| `transaction-hash` | Transaction hash of the deployment/upgrade |
| `gas-used` | Gas used for the deployment |
| `verified` | Whether contract verification succeeded |

## Example Deploy Script

Create a Forge script that deploys your contracts:

```solidity
// script/Deploy.s.sol
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/MyContract.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        
        // Deploy implementation
        MyContract implementation = new MyContract();
        
        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            MyContract.initialize.selector,
            "Initial Value"
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        
        console.log("Implementation deployed at:", address(implementation));
        console.log("Proxy deployed at:", address(proxy));
        
        vm.stopBroadcast();
    }
}
```

## UUPS Upgrade Example

For upgrades, your contract should inherit from OpenZeppelin's `UUPSUpgradeable`:

```solidity
// src/MyContract.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyContract is UUPSUpgradeable, OwnableUpgradeable {
    function initialize(string memory _value) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        // Initialize your contract
    }
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}
}
```

## Security Considerations

1. **Private Keys**: Always use GitHub secrets for private keys
2. **Testing**: The action runs tests before deployment
3. **Verification**: Enable contract verification for transparency
4. **Ownership**: Ensure proper access controls in your upgradeable contracts

## Supported Networks

- Ethereum (mainnet, sepolia, goerli)
- Polygon (polygon, polygon-mumbai)  
- Arbitrum (arbitrum, arbitrum-sepolia)
- Optimism (optimism, optimism-sepolia)
- Base (base, base-sepolia)

## License

MIT
