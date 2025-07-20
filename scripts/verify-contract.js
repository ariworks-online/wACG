const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying WrappedACG Contract on BSCscan...");

  // Contract addresses from deployment
  const proxyAddress = "0xD774b89a621C2a6595b80CE260F7165a9A7A3846";
  const implementationAddress = "0xc12d5290b25Ec7132845f91f9729fB1AF92cf233";
  
  // Constructor parameters
  const bridgeOperator = "0xE70D19b3B88cB79E62962D86d284af6f6269864C";
  const owner = "0xE70D19b3B88cB79E62962D86d284af6f6269864C";
  const emergencyRecovery = "0x65d3083F153372940149b41E820457253d14Ab0E";
  const maxSupply = "5194042200000000"; // 51,940,422 ACG (8 decimals)
  const dailyMintLimit = "10000000000000"; // 100,000 ACG (8 decimals)
  const dailyBurnLimit = "10000000000000"; // 100,000 ACG (8 decimals)

  console.log("📋 Contract Information:");
  console.log(`Proxy Address: ${proxyAddress}`);
  console.log(`Implementation Address: ${implementationAddress}`);
  console.log(`Bridge Operator: ${bridgeOperator}`);
  console.log(`Owner: ${owner}`);
  console.log(`Emergency Recovery: ${emergencyRecovery}`);
  console.log(`Max Supply: ${ethers.formatUnits(maxSupply, 8)} ACG`);
  console.log(`Daily Mint Limit: ${ethers.formatUnits(dailyMintLimit, 8)} ACG`);
  console.log(`Daily Burn Limit: ${ethers.formatUnits(dailyBurnLimit, 8)} ACG`);

  console.log("\n🔗 BSCscan Verification Commands:");
  console.log("\n1. Verify Proxy Contract (Main Contract):");
  console.log(`npx hardhat verify --network bscMainnet ${proxyAddress}`);
  
  console.log("\n2. Verify Implementation Contract:");
  console.log(`npx hardhat verify --network bscMainnet ${implementationAddress}`);
  
  console.log("\n3. If manual verification needed, use these parameters:");
  console.log(`Proxy Constructor: No parameters (UUPS proxy)`);
  console.log(`Implementation Constructor: ${bridgeOperator} ${owner} ${emergencyRecovery} ${maxSupply} ${dailyMintLimit} ${dailyBurnLimit}`);

  console.log("\n📝 Manual Verification Steps:");
  console.log("1. Go to https://bscscan.com/");
  console.log(`2. Search for: ${proxyAddress}`);
  console.log("3. Click 'Contract' tab");
  console.log("4. Click 'Verify and Publish'");
  console.log("5. Select 'Solidity (Standard-Json-Input)'");
  console.log("6. Upload the flattened contract");
  console.log("7. Enter constructor parameters if needed");

  console.log("\n🎯 Token Information for BSCscan:");
  console.log("Token Name: Wrapped ACG");
  console.log("Token Symbol: wACG");
  console.log("Decimals: 8");
  console.log("Total Supply: 51,940,422 wACG");
  console.log("Contract Type: UUPS Upgradeable Proxy");
  console.log("Network: Binance Smart Chain (BSC)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  }); 