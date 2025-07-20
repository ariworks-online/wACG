const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking Bridge Wallet Balances...");
  
  const deployerAddress = "0xE70D19b3B88cB79E62962D86d284af6f6269864C";
  const safeAddress = "0x65d3083F153372940149b41E820457253d14Ab0E";
  
  // Get provider
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  try {
    // Check deployer wallet balance
    const deployerBalance = await provider.getBalance(deployerAddress);
    const deployerBalanceBNB = ethers.formatEther(deployerBalance);
    
    // Check Safe wallet balance
    const safeBalance = await provider.getBalance(safeAddress);
    const safeBalanceBNB = ethers.formatEther(safeBalance);
    
    console.log("\n📊 Wallet Balance Report:");
    console.log("=" * 50);
    
    console.log(`\n🔧 Deployer Wallet (Daily Operations):`);
    console.log(`Address: ${deployerAddress}`);
    console.log(`Balance: ${deployerBalanceBNB} BNB`);
    console.log(`Status: ${parseFloat(deployerBalanceBNB) >= 0.4 ? '✅ Sufficient' : '⚠️ Low Balance'}`);
    
    console.log(`\n🔐 Safe Wallet (Admin Functions):`);
    console.log(`Address: ${safeAddress}`);
    console.log(`Balance: ${safeBalanceBNB} BNB`);
    console.log(`Status: ${parseFloat(safeBalanceBNB) >= 0.15 ? '✅ Sufficient' : '⚠️ Low Balance'}`);
    
    // Calculate totals
    const totalBalance = parseFloat(deployerBalanceBNB) + parseFloat(safeBalanceBNB);
    console.log(`\n💰 Total Bridge Funding: ${totalBalance.toFixed(4)} BNB`);
    
    // Recommendations
    console.log("\n📋 Recommendations:");
    if (parseFloat(deployerBalanceBNB) < 0.4) {
      console.log("⚠️ Deployer wallet needs more funding for daily operations");
    } else {
      console.log("✅ Deployer wallet has sufficient funds for daily operations");
    }
    
    if (parseFloat(safeBalanceBNB) < 0.15) {
      console.log("⚠️ Safe wallet needs more funding for admin functions");
    } else {
      console.log("✅ Safe wallet has sufficient funds for admin functions");
    }
    
    if (totalBalance >= 0.6) {
      console.log("🎉 Bridge is fully funded and ready for operations!");
    } else {
      console.log("⚠️ Consider additional funding for optimal operations");
    }
    
  } catch (error) {
    console.error("❌ Error checking balances:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 