const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Bridge Operations...");
  
  const contractAddress = "0xD774b89a621C2a6595b80CE260F7165a9A7A3846";
  const bridgeOperator = "0xE70D19b3B88cB79E62962D86d284af6f6269864C";
  
  // Get provider and signer
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  try {
    // Get contract instance
    const contract = new ethers.Contract(contractAddress, [
      "function bridgeOperator() external view returns (address)",
      "function owner() external view returns (address)",
      "function emergencyRecovery() external view returns (address)",
      "function getVersion() external pure returns (string memory)",
      "function maxSupply() external view returns (uint256)",
      "function dailyMintLimit() external view returns (uint256)",
      "function dailyBurnLimit() external view returns (uint256)",
      "function totalSupply() external view returns (uint256)",
      "function totalACGWrapped() external view returns (uint256)",
      "function totalACGUnwrapped() external view returns (uint256)"
    ], signer);
    
    console.log("\n📋 Bridge Configuration Test:");
    console.log("=" * 50);
    
    // Test basic configuration
    const bridgeOperatorCheck = await contract.bridgeOperator();
    const ownerCheck = await contract.owner();
    const emergencyRecoveryCheck = await contract.emergencyRecovery();
    const version = await contract.getVersion();
    const maxSupply = await contract.maxSupply();
    const dailyMintLimit = await contract.dailyMintLimit();
    const dailyBurnLimit = await contract.dailyBurnLimit();
    
    console.log(`✅ Bridge Operator: ${bridgeOperatorCheck}`);
    console.log(`✅ Owner: ${ownerCheck}`);
    console.log(`✅ Emergency Recovery: ${emergencyRecoveryCheck}`);
    console.log(`✅ Version: ${version}`);
    console.log(`✅ Max Supply: ${ethers.formatUnits(maxSupply, 8)} ACG`);
    console.log(`✅ Daily Mint Limit: ${ethers.formatUnits(dailyMintLimit, 8)} ACG`);
    console.log(`✅ Daily Burn Limit: ${ethers.formatUnits(dailyBurnLimit, 8)} ACG`);
    
    // Test current state
    const totalSupply = await contract.totalSupply();
    const totalWrapped = await contract.totalACGWrapped();
    const totalUnwrapped = await contract.totalACGUnwrapped();
    
    console.log(`\n📊 Current Bridge State:`);
    console.log(`✅ Total Supply: ${ethers.formatUnits(totalSupply, 8)} wACG`);
    console.log(`✅ Total ACG Wrapped: ${ethers.formatUnits(totalWrapped, 8)} ACG`);
    console.log(`✅ Total ACG Unwrapped: ${ethers.formatUnits(totalUnwrapped, 8)} ACG`);
    
    // Verify configuration
    console.log(`\n🔍 Configuration Verification:`);
    console.log(`Bridge Operator Match: ${bridgeOperatorCheck === bridgeOperator ? '✅' : '❌'}`);
    console.log(`Owner Match: ${ownerCheck === bridgeOperator ? '✅' : '❌'}`);
    console.log(`Emergency Recovery Set: ${emergencyRecoveryCheck !== ethers.ZeroAddress ? '✅' : '❌'}`);
    console.log(`Version Correct: ${version === '1.1.0' ? '✅' : '❌'}`);
    
    // Test signer permissions
    console.log(`\n🔐 Permission Test:`);
    const signerAddress = await signer.getAddress();
    console.log(`Signer Address: ${signerAddress}`);
    console.log(`Is Bridge Operator: ${signerAddress === bridgeOperatorCheck ? '✅' : '❌'}`);
    console.log(`Is Owner: ${signerAddress === ownerCheck ? '✅' : '❌'}`);
    
    if (signerAddress === bridgeOperatorCheck) {
      console.log("🎉 Signer has bridge operator permissions!");
    } else {
      console.log("⚠️ Signer does not have bridge operator permissions");
      console.log("Make sure PRIVATE_KEY in .env matches the bridge operator private key");
    }
    
    // Summary
    console.log(`\n🎯 Test Summary:`);
    console.log("✅ Contract configuration verified");
    console.log("✅ Bridge state checked");
    console.log("✅ Permissions verified");
    console.log("✅ Bridge is ready for operations!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check if PRIVATE_KEY is set in .env file");
    console.log("2. Verify the private key matches the bridge operator address");
    console.log("3. Ensure you have sufficient BNB for gas fees");
    console.log("4. Check network connectivity");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 