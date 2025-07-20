const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying contract supply and balances...");

  try {
    // Get the deployed contract
    const contractAddress = "0xda83b336e6a30F730E29C901CF6E24e6285B4E79";
    const WrappedACG = await ethers.getContractFactory("WrappedACGUpgradeable");
    const wrappedACG = WrappedACG.attach(contractAddress);

    // Get contract details
    const decimals = await wrappedACG.decimals();
    const totalSupply = await wrappedACG.totalSupply();
    const name = await wrappedACG.name();
    const symbol = await wrappedACG.symbol();

    console.log(`\n📊 Contract: ${name} (${symbol})`);
    console.log(`   Address: ${contractAddress}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
    console.log(`   Total Supply (raw): ${totalSupply.toString()}`);

    // Check specific addresses
    const addresses = [
      "0x1234567890123456789012345678901234567890", // Test recipient
      "0xA3f3ECF8b52D90712Eb033357Bc4d1730282C59B"  // Bridge operator
    ];

    console.log("\n💰 Balances:");
    for (const address of addresses) {
      const balance = await wrappedACG.balanceOf(address);
      console.log(`   ${address}: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
    }

    // Check if contract is paused
    const paused = await wrappedACG.paused();
    console.log(`\n⏸️  Contract Paused: ${paused}`);

    console.log("\n✅ Verification completed!");

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }); 