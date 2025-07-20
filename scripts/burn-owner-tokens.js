const { ethers } = require("hardhat");

async function main() {
  // Get the signer (owner)
  const [owner] = await ethers.getSigners();
  console.log("Owner address:", owner.address);

  // Get the wACG contract
  const WrappedACG = await ethers.getContractFactory("WrappedACG");
  const wacgAddress = "0x7Af31e919851a833e1Bd9cCcef15992658792abA"; // Your deployed contract address
  const wacg = WrappedACG.attach(wacgAddress);

  // Check current balance
  const balance = await wacg.balanceOf(owner.address);
  console.log("Current wACG balance:", ethers.formatUnits(balance, 8));

  // Get bridge operator address
  const bridgeOperator = await wacg.bridgeOperator();
  console.log("Bridge operator address:", bridgeOperator);

  // Burn 100 wACG tokens (100 * 10^8 = 10000000000)
  const burnAmount = ethers.parseUnits("100", 8);
  console.log("Burning", ethers.formatUnits(burnAmount, 8), "wACG tokens...");

  // Burn the tokens using burnFrom (only bridge operator can call this)
  const tx = await wacg.burnFrom(owner.address, burnAmount);
  await tx.wait();

  console.log("Burn transaction hash:", tx.hash);
  console.log("✅ Successfully burned 100 wACG tokens!");

  // Check new balance
  const newBalance = await wacg.balanceOf(owner.address);
  console.log("New wACG balance:", ethers.formatUnits(newBalance, 8));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 