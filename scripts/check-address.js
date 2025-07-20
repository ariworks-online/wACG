const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking address type and balance...");
  
  const address = "0xA3f3ECF8b52D90712Eb033357Bc4d1730282C59B";
  
  // Get provider
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  try {
    // Check if it's a contract
    const code = await provider.getCode(address);
    const isContract = code !== "0x";
    
    // Get balance
    const balance = await provider.getBalance(address);
    const balanceInBNB = ethers.formatEther(balance);
    
    console.log(`\n📋 Address Analysis: ${address}`);
    console.log(`Type: ${isContract ? 'Contract' : 'EOA (Externally Owned Account)'}`);
    console.log(`Balance: ${balanceInBNB} BNB`);
    console.log(`Code Length: ${code.length} characters`);
    
    if (isContract) {
      console.log("\n⚠️  WARNING: This is a CONTRACT address!");
      console.log("❌ You cannot send BNB directly to a contract address");
      console.log("❌ The BNB you sent (0.1 BNB) may be lost!");
      console.log("\n🔧 Solution:");
      console.log("1. We need to use a different EOA address for the deployer");
      console.log("2. Generate a new wallet for bridge operations");
      console.log("3. Update all configuration files");
    } else {
      console.log("\n✅ This is a valid EOA address");
      console.log("✅ Safe to use for bridge operations");
    }
    
  } catch (error) {
    console.error("❌ Error checking address:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 