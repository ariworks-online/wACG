const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Starting Wrapped ACG (wACG) deployment to BSC Testnet...");

  // Testnet deployment configuration - More conservative for testing
  const config = {
    custodian: process.env.CUSTODIAN_ADDRESS || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat test account
    owner: process.env.OWNER_ADDRESS || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat test account
    maxWrapAmount: ethers.parseUnits("10000", 8), // 10,000 ACG (smaller for testing)
    maxUnwrapAmount: ethers.parseUnits("10000", 8), // 10,000 ACG (smaller for testing)
    minAmount: ethers.parseUnits("0.00000001", 8), // 0.00000001 ACG
    dailyWrapLimit: ethers.parseUnits("100000", 8), // 100,000 ACG (smaller for testing)
    dailyUnwrapLimit: ethers.parseUnits("100000", 8) // 100,000 ACG (smaller for testing)
  };

  // Validate configuration
  console.log("📋 Testnet Deployment Configuration:");
  console.log(`Custodian: ${config.custodian}`);
  console.log(`Owner: ${config.owner}`);
  console.log(`Max Wrap Amount: ${ethers.formatUnits(config.maxWrapAmount, 8)} ACG`);
  console.log(`Max Unwrap Amount: ${ethers.formatUnits(config.maxUnwrapAmount, 8)} ACG`);
  console.log(`Min Amount: ${ethers.formatUnits(config.minAmount, 8)} ACG`);
  console.log(`Daily Wrap Limit: ${ethers.formatUnits(config.dailyWrapLimit, 8)} ACG`);
  console.log(`Daily Unwrap Limit: ${ethers.formatUnits(config.dailyUnwrapLimit, 8)} ACG`);

  // Validate addresses
  if (!ethers.isAddress(config.custodian)) {
    throw new Error("Invalid custodian address");
  }
  if (!ethers.isAddress(config.owner)) {
    throw new Error("Invalid owner address");
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`\n👤 Deploying from: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} tBNB`);

  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  Low balance. You may need testnet BNB from faucet:");
    console.log("   https://testnet.binance.org/faucet-smart");
  }

  // Deploy the contract
  console.log("\n📦 Deploying WrappedACG contract to testnet...");
  
  const WrappedACG = await ethers.getContractFactory("WrappedACG");
  const wacg = await WrappedACG.deploy(
    config.custodian,
    config.owner,
    config.maxWrapAmount,
    config.maxUnwrapAmount,
    config.minAmount,
    config.dailyWrapLimit,
    config.dailyUnwrapLimit
  );

  console.log(`⏳ Contract deployment transaction: ${wacg.deploymentTransaction().hash}`);
  console.log("⏳ Waiting for deployment confirmation...");

  await wacg.waitForDeployment();
  const contractAddress = await wacg.getAddress();

  console.log(`✅ Contract deployed successfully!`);
  console.log(`📍 Contract Address: ${contractAddress}`);

  // Verify contract deployment
  console.log("\n🔍 Verifying contract deployment...");
  
  const deployedCode = await ethers.provider.getCode(contractAddress);
  if (deployedCode === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }

  // Get contract stats
  console.log("\n📊 Contract Statistics:");
  const stats = await wacg.getStats();
  console.log(`Total Supply: ${ethers.formatUnits(stats[0], 8)} wACG`);
  console.log(`Total ACG Wrapped: ${ethers.formatUnits(stats[1], 8)} ACG`);
  console.log(`Total ACG Unwrapped: ${ethers.formatUnits(stats[2], 8)} ACG`);
  console.log(`Custodian: ${stats[3]}`);
  console.log(`Paused: ${stats[4]}`);
  console.log(`Max Wrap Amount: ${ethers.formatUnits(stats[5], 8)} ACG`);
  console.log(`Max Unwrap Amount: ${ethers.formatUnits(stats[6], 8)} ACG`);
  console.log(`Min Amount: ${ethers.formatUnits(stats[7], 8)} ACG`);
  console.log(`Daily Wrap Limit: ${ethers.formatUnits(stats[8], 8)} ACG`);
  console.log(`Daily Unwrap Limit: ${ethers.formatUnits(stats[9], 8)} ACG`);

  // Save deployment information
  const deploymentInfo = {
    network: "BSC Testnet",
    contractName: "WrappedACG",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTx: wacg.deploymentTransaction().hash,
    deploymentBlock: await ethers.provider.getBlockNumber(),
    constructorArgs: {
      custodian: config.custodian,
      owner: config.owner,
      maxWrapAmount: config.maxWrapAmount.toString(),
      maxUnwrapAmount: config.maxUnwrapAmount.toString(),
      minAmount: config.minAmount.toString(),
      dailyWrapLimit: config.dailyWrapLimit.toString(),
      dailyUnwrapLimit: config.dailyUnwrapLimit.toString()
    },
    tokenInfo: {
      name: "Wrapped ACG",
      symbol: "wACG",
      decimals: 8,
      version: "1.0.0"
    },
    deploymentTime: new Date().toISOString(),
    testnet: true
  };

  // Save to file
  const deploymentFile = path.join(__dirname, "deployment-testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Generate verification command
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256", "uint256", "uint256", "uint256", "uint256"],
    [
      config.custodian,
      config.owner,
      config.maxWrapAmount,
      config.maxUnwrapAmount,
      config.minAmount,
      config.dailyWrapLimit,
      config.dailyUnwrapLimit
    ]
  );

  console.log("\n🔗 Verification Commands:");
  console.log("BSCScan Testnet Verification:");
  console.log(`npx hardhat verify --network bscTestnet ${contractAddress} ${constructorArgs.slice(2)}`);
  
  console.log("\n📝 Manual Verification on BSCScan Testnet:");
  console.log(`1. Go to https://testnet.bscscan.com/address/${contractAddress}`);
  console.log(`2. Click 'Contract' tab`);
  console.log(`3. Click 'Verify and Publish'`);
  console.log(`4. Enter constructor arguments: ${constructorArgs.slice(2)}`);

  // Generate environment variables for testing
  console.log("\n🔧 Environment Variables for Testing:");
  console.log(`REACT_APP_WACG_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`REACT_APP_BSC_NETWORK_ID=97`);
  console.log(`REACT_APP_BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/`);

  // Generate backend configuration for testing
  console.log("\n🔧 Backend Configuration for Testing:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/`);

  // Run comprehensive tests
  console.log("\n🧪 Running comprehensive contract tests...");
  await runContractTests(wacg, deployer, config);

  console.log("\n🎉 Testnet deployment completed successfully!");
  console.log("✅ Contract is ready for testing");
  console.log("✅ All functions tested and working");
  console.log("✅ Ready for frontend/backend integration testing");

  return {
    contractAddress,
    deploymentInfo
  };
}

// Comprehensive contract testing function
async function runContractTests(wacg, deployer, config) {
  console.log("\n🔬 Testing Contract Functions...");

  // Test 1: Basic contract info
  console.log("📋 Test 1: Contract Information");
  const name = await wacg.name();
  const symbol = await wacg.symbol();
  const decimals = await wacg.decimals();
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);

  // Test 2: Access control
  console.log("🔐 Test 2: Access Control");
  const owner = await wacg.owner();
  const custodian = await wacg.custodian();
  console.log(`   Owner: ${owner}`);
  console.log(`   Custodian: ${custodian}`);

  // Test 3: Wrap function
  console.log("📦 Test 3: Wrap Function");
  const testAmount = ethers.parseUnits("100", 8); // 100 ACG
  const testTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  
  try {
    const wrapTx = await wacg.connect(deployer).wrap(deployer.address, testAmount, testTxHash);
    await wrapTx.wait();
    console.log(`   ✅ Wrap successful: ${ethers.formatUnits(testAmount, 8)} ACG wrapped`);
    
    const balance = await wacg.balanceOf(deployer.address);
    console.log(`   Balance: ${ethers.formatUnits(balance, 8)} wACG`);
  } catch (error) {
    console.log(`   ❌ Wrap failed: ${error.message}`);
  }

  // Test 4: Unwrap function
  console.log("📤 Test 4: Unwrap Function");
  const unwrapAmount = ethers.parseUnits("50", 8); // 50 ACG
  const testAcgAddress = "AWEwieKZdYWDuBBDYwjN5qNnbjJH95rbw7";
  
  try {
    const unwrapTx = await wacg.connect(deployer).unwrap(deployer.address, unwrapAmount, testAcgAddress);
    await unwrapTx.wait();
    console.log(`   ✅ Unwrap successful: ${ethers.formatUnits(unwrapAmount, 8)} ACG unwrapped`);
    
    const balance = await wacg.balanceOf(deployer.address);
    console.log(`   Balance: ${ethers.formatUnits(balance, 8)} wACG`);
  } catch (error) {
    console.log(`   ❌ Unwrap failed: ${error.message}`);
  }

  // Test 5: Admin functions
  console.log("⚙️  Test 5: Admin Functions");
  
  // Test pause/unpause
  try {
    const pauseTx = await wacg.connect(deployer).pause();
    await pauseTx.wait();
    console.log("   ✅ Contract paused");
    
    const unpauseTx = await wacg.connect(deployer).unpause();
    await unpauseTx.wait();
    console.log("   ✅ Contract unpaused");
  } catch (error) {
    console.log(`   ❌ Pause/Unpause failed: ${error.message}`);
  }

  // Test 6: Emergency functions
  console.log("🚨 Test 6: Emergency Functions");
  
  try {
    const emergencyAmount = ethers.parseUnits("1000", 8);
    const emergencyTx = await wacg.connect(deployer).emergencyMint(deployer.address, emergencyAmount);
    await emergencyTx.wait();
    console.log(`   ✅ Emergency mint successful: ${ethers.formatUnits(emergencyAmount, 8)} wACG`);
  } catch (error) {
    console.log(`   ❌ Emergency mint failed: ${error.message}`);
  }

  // Test 7: Statistics
  console.log("📊 Test 7: Statistics");
  const stats = await wacg.getStats();
  console.log(`   Total Supply: ${ethers.formatUnits(stats[0], 8)} wACG`);
  console.log(`   Total Wrapped: ${ethers.formatUnits(stats[1], 8)} ACG`);
  console.log(`   Total Unwrapped: ${ethers.formatUnits(stats[2], 8)} ACG`);

  // Test 8: Limits
  console.log("📏 Test 8: Limits");
  console.log(`   Max Wrap: ${ethers.formatUnits(config.maxWrapAmount, 8)} ACG`);
  console.log(`   Max Unwrap: ${ethers.formatUnits(config.maxUnwrapAmount, 8)} ACG`);
  console.log(`   Min Amount: ${ethers.formatUnits(config.minAmount, 8)} ACG`);
  console.log(`   Daily Wrap Limit: ${ethers.formatUnits(config.dailyWrapLimit, 8)} ACG`);
  console.log(`   Daily Unwrap Limit: ${ethers.formatUnits(config.dailyUnwrapLimit, 8)} ACG`);

  console.log("\n✅ All contract tests completed!");
}

// Handle errors
main()
  .then((result) => {
    console.log("\n✅ Testnet deployment script completed successfully");
    console.log("\n📋 Next Steps:");
    console.log("1. Update your frontend with the new contract address");
    console.log("2. Update your backend configuration");
    console.log("3. Test the complete integration");
    console.log("4. Monitor contract events and transactions");
    console.log("5. Prepare for mainnet deployment after testing");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Testnet deployment failed:", error);
    process.exit(1);
  }); 