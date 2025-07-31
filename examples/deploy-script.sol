// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MyUpgradeableContract.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title Deploy Script Example
 * @dev Example deployment script for UUPS upgradeable contracts
 * 
 * Usage:
 * forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
 */
contract DeployScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the implementation contract
        MyUpgradeableContract implementation = new MyUpgradeableContract();
        console.log("Implementation deployed at:", address(implementation));
        
        // Prepare initialization data
        string memory initialValue = "Hello, World!";
        uint256 initialNumber = 42;
        
        bytes memory initData = abi.encodeWithSelector(
            MyUpgradeableContract.initialize.selector,
            initialValue,
            initialNumber,
            deployer // Set deployer as initial owner
        );
        
        // Deploy the proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        
        console.log("Proxy deployed at:", address(proxy));
        
        // Verify the proxy is working
        MyUpgradeableContract proxiedContract = MyUpgradeableContract(address(proxy));
        console.log("Initial value:", proxiedContract.getValue());
        console.log("Initial number:", proxiedContract.getNumber());
        console.log("Owner:", proxiedContract.owner());
        
        vm.stopBroadcast();
        
        // Output deployment addresses for GitHub Action to parse
        console.log("Contract deployed at:", address(proxy));
        console.log("Implementation at:", address(implementation));
    }
}

/**
 * @title Upgrade Script Example
 * @dev Example script for upgrading UUPS contracts
 */
contract UpgradeScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        
        console.log("Upgrading proxy at:", proxyAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new implementation
        MyUpgradeableContractV2 newImplementation = new MyUpgradeableContractV2();
        console.log("New implementation deployed at:", address(newImplementation));
        
        // Get the proxy contract
        MyUpgradeableContract proxy = MyUpgradeableContract(proxyAddress);
        
        // Upgrade the proxy (only owner can do this)
        proxy.upgradeToAndCall(
            address(newImplementation),
            "" // No additional initialization data needed
        );
        
        console.log("Proxy upgraded successfully");
        
        // Verify upgrade
        MyUpgradeableContractV2 upgradedContract = MyUpgradeableContractV2(proxyAddress);
        console.log("New feature available:", upgradedContract.getNewFeature());
        
        vm.stopBroadcast();
        
        // Output for GitHub Action
        console.log("Contract deployed at:", proxyAddress);
        console.log("Implementation at:", address(newImplementation));
    }
}