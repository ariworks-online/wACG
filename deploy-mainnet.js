const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Wrapped ACG (wACG) deployment to BSC Mainnet...");

  // Load deployment configuration
  const config = {
    custodian: process.env.CUSTODIAN_ADDRESS,
    owner: process.env.OWNER_ADDRESS,
    maxWrapAmount: ethers.parseUnits("1000000", 8), // 1,000,000 ACG
    maxUnwrapAmount: ethers.parseUnits("1000000", 8), // 1,000,000 ACG
    minAmount: ethers.parseUnits("0.00000001", 8), // 0.00000001 ACG
    dailyWrapLimit: ethers.parseUnits("10000000", 8), // 10,000,000 ACG
    dailyUnwrapLimit: ethers.parseUnits("10000000", 8) // 10,000,000 ACG
  };

  // Validate configuration
  console.log("📋 Deployment Configuration:");
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
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} BNB`);

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient BNB for deployment");
  }

  // Deploy the contract
  console.log("\n📦 Deploying WrappedACG contract...");
  
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
    network: "BSC Mainnet",
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
    deploymentTime: new Date().toISOString()
  };

  // Save to file
  const deploymentFile = path.join(__dirname, "deployment-mainnet.json");
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
  console.log("BSCScan Verification:");
  console.log(`npx hardhat verify --network bsc ${contractAddress} ${constructorArgs.slice(2)}`);
  
  console.log("\n📝 Manual Verification on BSCScan:");
  console.log(`1. Go to https://bscscan.com/address/${contractAddress}`);
  console.log(`2. Click 'Contract' tab`);
  console.log(`3. Click 'Verify and Publish'`);
  console.log(`4. Enter constructor arguments: ${constructorArgs.slice(2)}`);

  // Generate environment variables
  console.log("\n🔧 Environment Variables for Frontend:");
  console.log(`REACT_APP_WACG_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`REACT_APP_BSC_NETWORK_ID=56`);
  console.log(`REACT_APP_BSC_RPC_URL=https://bsc-dataseed.binance.org/`);

  // Generate backend configuration
  console.log("\n🔧 Backend Configuration:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`BSC_RPC_URL=https://bsc-dataseed.binance.org/`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("⚠️  IMPORTANT: Verify the contract on BSCScan before proceeding with production use.");
  console.log("⚠️  IMPORTANT: Test all functions thoroughly on mainnet before announcing.");
  console.log("⚠️  IMPORTANT: Ensure custodian and owner addresses are multi-sig wallets.");

  return {
    contractAddress,
    deploymentInfo
  };
}

// Handle errors
main()
  .then((result) => {
    console.log("\n✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }); 