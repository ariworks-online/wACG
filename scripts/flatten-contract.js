const fs = require('fs');
const path = require('path');

async function main() {
  console.log("📄 Flattening WrappedACG contract for BSCscan verification...");

  // Read the main contract
  const contractPath = path.join(__dirname, '../contracts/WrappedACG.sol');
  const contractContent = fs.readFileSync(contractPath, 'utf8');

  // Create flattened version
  const flattenedContent = `// SPDX-License-Identifier: MIT
// Flattened WrappedACG Contract for BSCscan Verification
// Original: contracts/WrappedACG.sol

${contractContent}`;

  // Write flattened contract
  const outputPath = path.join(__dirname, '../WrappedACG-flattened.sol');
  fs.writeFileSync(outputPath, flattenedContent);

  console.log("✅ Contract flattened successfully!");
  console.log(`📁 Output: ${outputPath}`);
  console.log("\n📋 Next Steps:");
  console.log("1. Go to https://bscscan.com/address/0xD774b89a621C2a6595b80CE260F7165a9A7A3846");
  console.log("2. Click 'Contract' tab");
  console.log("3. Click 'Verify and Publish'");
  console.log("4. Select 'Solidity (Standard-Json-Input)'");
  console.log("5. Upload the flattened contract file");
  console.log("6. No constructor parameters needed (UUPS proxy)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Flattening failed:", error);
    process.exit(1);
  }); 