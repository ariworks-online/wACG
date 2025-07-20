const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🔄 Upgrading WrappedACG contract...");

  try {
    // Get the contract factory for the new implementation
    const WrappedACG = await ethers.getContractFactory("WrappedACG");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📋 Deployer: ${deployer.address}`);

    // Get the proxy address from environment or use default
    const proxyAddress = process.env.PROXY_ADDRESS;
    if (!proxyAddress) {
      throw new Error("PROXY_ADDRESS environment variable is required");
    }

    console.log(`📋 Proxy Address: ${proxyAddress}`);

    // Validate proxy address
    if (!ethers.isAddress(proxyAddress)) {
      throw new Error(`Invalid proxy address: ${proxyAddress}`);
    }

    // Get current implementation address
    const currentImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`📋 Current Implementation: ${currentImplementation}`);

    // Upgrade the contract
    console.log("\n🔨 Upgrading contract...");
    const upgradedContract = await upgrades.upgradeProxy(proxyAddress, WrappedACG);
    
    // Wait for upgrade to complete
    await upgradedContract.waitForDeployment();
    
    // Get the new implementation address
    const newImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    
    console.log("\n✅ Contract upgraded successfully!");
    console.log(`   Proxy Address: ${proxyAddress}`);
    console.log(`   New Implementation: ${newImplementation}`);
    console.log(`   Transaction Hash: ${upgradedContract.deploymentTransaction().hash}`);

    // Verify contract state
    console.log("\n🔍 Verifying contract state...");
    
    const bridgeOperator = await upgradedContract.bridgeOperator();
    const owner = await upgradedContract.owner();
    const name = await upgradedContract.name();
    const symbol = await upgradedContract.symbol();
    const decimals = await upgradedContract.decimals();
    const paused = await upgradedContract.paused();
    const version = await upgradedContract.getVersion();

    console.log("   Contract Details:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Version: ${version}`);
    console.log(`   Bridge Operator: ${bridgeOperator}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Paused: ${paused}`);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    
    // Test bridge stats
    const stats = await upgradedContract.getBridgeStats();
    console.log("   Bridge Stats:");
    console.log(`   Total ACG Wrapped: ${ethers.formatUnits(stats[0], 8)} ACG`);
    console.log(`   Total ACG Unwrapped: ${ethers.formatUnits(stats[1], 8)} ACG`);
    console.log(`   Total Supply: ${ethers.formatUnits(stats[2], 8)} wACG`);

    console.log("\n🔗 BSCScan Testnet Links:");
    console.log(`   Proxy: https://testnet.bscscan.com/address/${proxyAddress}`);
    console.log(`   New Implementation: https://testnet.bscscan.com/address/${newImplementation}`);

    console.log("\n🔗 Contract Verification Commands:");
    console.log(`   New Implementation: npx hardhat verify --network bscTestnet ${newImplementation}`);

    // Save upgrade info
    const upgradeInfo = {
      network: "BSC Testnet",
      proxyAddress: proxyAddress,
      oldImplementation: currentImplementation,
      newImplementation: newImplementation,
      deployer: deployer.address,
      transactionHash: upgradedContract.deploymentTransaction().hash,
      timestamp: new Date().toISOString(),
      version: version,
      type: "upgrade"
    };

    console.log("\n📄 Upgrade Summary:");
    console.log(JSON.stringify(upgradeInfo, null, 2));

    console.log("\n✅ Upgrade completed successfully!");
    console.log("   The proxy address remains the same for users");
    console.log("   All existing data and state are preserved");

  } catch (error) {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  }); 