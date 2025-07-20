const { ethers } = require("hardhat");

async function main() {
  console.log("🔐 Generating new EOA wallet for bridge operations...");
  
  // Generate a new wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("\n✅ New EOA Wallet Generated:");
  console.log(`Address: ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log(`Mnemonic: ${wallet.mnemonic.phrase}`);
  
  console.log("\n📋 Next Steps:");
  console.log("1. Fund this new address with 0.45 BNB for bridge operations");
  console.log("2. Update deployment script with new address");
  console.log("3. Update all configuration files");
  console.log("4. Deploy the contract with the new address");
  
  console.log("\n⚠️  IMPORTANT:");
  console.log("- Save the private key securely");
  console.log("- Never share the private key");
  console.log("- Use this address for daily bridge operations");
  
  // Save to file (optional)
  const fs = require('fs');
  const walletInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    generatedAt: new Date().toISOString(),
    purpose: "Bridge operations wallet (EOA)"
  };
  
  fs.writeFileSync('new-bridge-wallet.json', JSON.stringify(walletInfo, null, 2));
  console.log("\n💾 Wallet info saved to 'new-bridge-wallet.json'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 