const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WrappedACG", function () {
  let WrappedACG;
  let wrappedACG;
  let owner;
  let bridgeOperator;
  let user1;
  let user2;
  let user3;

  const testAmount = ethers.parseUnits("100", 8); // 100 ACG
  const acgTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const acgAddress = "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6";
  const requestId = ethers.keccak256(ethers.toUtf8Bytes("test-request-1"));

  beforeEach(async function () {
    [owner, bridgeOperator, user1, user2, user3] = await ethers.getSigners();
    
    WrappedACG = await ethers.getContractFactory("WrappedACG");
    wrappedACG = await WrappedACG.deploy(bridgeOperator.address, owner.address);
    await wrappedACG.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct bridge operator and owner", async function () {
      expect(await wrappedACG.bridgeOperator()).to.equal(bridgeOperator.address);
      expect(await wrappedACG.owner()).to.equal(owner.address);
    });

    it("Should have correct token details", async function () {
      expect(await wrappedACG.name()).to.equal("Wrapped ACG");
      expect(await wrappedACG.symbol()).to.equal("wACG");
      expect(await wrappedACG.decimals()).to.equal(8);
    });

    it("Should start with zero total supply", async function () {
      expect(await wrappedACG.totalSupply()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      expect(await wrappedACG.paused()).to.be.false;
    });
  });

  describe("Bridge Mint", function () {
    it("Should allow bridge operator to mint tokens", async function () {
      await wrappedACG.connect(bridgeOperator).bridgeMint(
        user1.address,
        testAmount,
        acgTxHash,
        requestId
      );

      expect(await wrappedACG.balanceOf(user1.address)).to.equal(testAmount);
      expect(await wrappedACG.totalSupply()).to.equal(testAmount);
      expect(await wrappedACG.isRequestProcessed(requestId)).to.be.true;
    });

    it("Should emit BridgeMint event", async function () {
      const tx = await wrappedACG.connect(bridgeOperator).bridgeMint(
        user1.address,
        testAmount,
        acgTxHash,
        requestId
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = wrappedACG.interface.parseLog(log);
          return parsed.name === "BridgeMint";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
    });

    it("Should revert if called by non-bridge operator", async function () {
      await expect(
        wrappedACG.connect(user1).bridgeMint(
          user2.address,
          testAmount,
          acgTxHash,
          requestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "OnlyBridgeOperator");
    });

    it("Should revert if recipient is zero address", async function () {
      await expect(
        wrappedACG.connect(bridgeOperator).bridgeMint(
          ethers.ZeroAddress,
          testAmount,
          acgTxHash,
          requestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "InvalidAddress");
    });

    it("Should revert if amount is zero", async function () {
      await expect(
        wrappedACG.connect(bridgeOperator).bridgeMint(
          user1.address,
          0,
          acgTxHash,
          requestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "InvalidAmount");
    });

    it("Should revert if request already processed", async function () {
      await wrappedACG.connect(bridgeOperator).bridgeMint(
        user1.address,
        testAmount,
        acgTxHash,
        requestId
      );

      await expect(
        wrappedACG.connect(bridgeOperator).bridgeMint(
          user2.address,
          testAmount,
          acgTxHash,
          requestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "RequestAlreadyProcessed");
    });

    it("Should revert when contract is paused", async function () {
      await wrappedACG.connect(owner).pause();

      await expect(
        wrappedACG.connect(bridgeOperator).bridgeMint(
          user1.address,
          testAmount,
          acgTxHash,
          requestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "EnforcedPause");
    });
  });

  describe("Bridge Burn", function () {
    beforeEach(async function () {
      // Mint tokens first
      await wrappedACG.connect(bridgeOperator).bridgeMint(
        user1.address,
        testAmount,
        acgTxHash,
        requestId
      );
    });

    it("Should allow bridge operator to burn tokens", async function () {
      const burnRequestId = ethers.keccak256(ethers.toUtf8Bytes("burn-request-1"));
      
      await wrappedACG.connect(bridgeOperator).bridgeBurn(
        user1.address,
        testAmount,
        acgAddress,
        burnRequestId
      );

      expect(await wrappedACG.balanceOf(user1.address)).to.equal(0);
      expect(await wrappedACG.totalSupply()).to.equal(0);
      expect(await wrappedACG.isRequestProcessed(burnRequestId)).to.be.true;
    });

    it("Should emit BridgeBurn event", async function () {
      const burnRequestId = ethers.keccak256(ethers.toUtf8Bytes("burn-request-2"));
      
      const tx = await wrappedACG.connect(bridgeOperator).bridgeBurn(
        user1.address,
        testAmount,
        acgAddress,
        burnRequestId
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = wrappedACG.interface.parseLog(log);
          return parsed.name === "BridgeBurn";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
    });

    it("Should revert if called by non-bridge operator", async function () {
      const burnRequestId = ethers.keccak256(ethers.toUtf8Bytes("burn-request-3"));
      
      await expect(
        wrappedACG.connect(user1).bridgeBurn(
          user1.address,
          testAmount,
          acgAddress,
          burnRequestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "OnlyBridgeOperator");
    });

    it("Should revert if from address is zero", async function () {
      const burnRequestId = ethers.keccak256(ethers.toUtf8Bytes("burn-request-4"));
      
      await expect(
        wrappedACG.connect(bridgeOperator).bridgeBurn(
          ethers.ZeroAddress,
          testAmount,
          acgAddress,
          burnRequestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "InvalidAddress");
    });

    it("Should revert if amount is zero", async function () {
      const burnRequestId = ethers.keccak256(ethers.toUtf8Bytes("burn-request-5"));
      
      await expect(
        wrappedACG.connect(bridgeOperator).bridgeBurn(
          user1.address,
          0,
          acgAddress,
          burnRequestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "InvalidAmount");
    });

    it("Should revert if request already processed", async function () {
      const burnRequestId = ethers.keccak256(ethers.toUtf8Bytes("burn-request-6"));
      
      await wrappedACG.connect(bridgeOperator).bridgeBurn(
        user1.address,
        testAmount,
        acgAddress,
        burnRequestId
      );

      await expect(
        wrappedACG.connect(bridgeOperator).bridgeBurn(
          user1.address,
          testAmount,
          acgAddress,
          burnRequestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "RequestAlreadyProcessed");
    });

    it("Should revert when contract is paused", async function () {
      const burnRequestId = ethers.keccak256(ethers.toUtf8Bytes("burn-request-7"));
      
      await wrappedACG.connect(owner).pause();

      await expect(
        wrappedACG.connect(bridgeOperator).bridgeBurn(
          user1.address,
          testAmount,
          acgAddress,
          burnRequestId
        )
      ).to.be.revertedWithCustomError(wrappedACG, "EnforcedPause");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update bridge operator", async function () {
      await expect(
        wrappedACG.connect(owner).updateBridgeOperator(user1.address)
      )
        .to.emit(wrappedACG, "BridgeOperatorUpdated")
        .withArgs(bridgeOperator.address, user1.address);

      expect(await wrappedACG.bridgeOperator()).to.equal(user1.address);
    });

    it("Should revert if non-owner tries to update bridge operator", async function () {
      await expect(
        wrappedACG.connect(user1).updateBridgeOperator(user2.address)
      ).to.be.revertedWithCustomError(wrappedACG, "OwnableUnauthorizedAccount");
    });

    it("Should revert if trying to set bridge operator to zero address", async function () {
      await expect(
        wrappedACG.connect(owner).updateBridgeOperator(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(wrappedACG, "InvalidAddress");
    });

    it("Should allow owner to pause and unpause", async function () {
      await wrappedACG.connect(owner).pause();
      expect(await wrappedACG.paused()).to.be.true;

      await wrappedACG.connect(owner).unpause();
      expect(await wrappedACG.paused()).to.be.false;
    });

    it("Should revert if non-owner tries to pause", async function () {
      await expect(
        wrappedACG.connect(user1).pause()
      ).to.be.revertedWithCustomError(wrappedACG, "OwnableUnauthorizedAccount");
    });

    it("Should revert if non-owner tries to unpause", async function () {
      await wrappedACG.connect(owner).pause();
      
      await expect(
        wrappedACG.connect(user1).unpause()
      ).to.be.revertedWithCustomError(wrappedACG, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token Transfers", function () {
    beforeEach(async function () {
      // Mint tokens to user1
      await wrappedACG.connect(bridgeOperator).bridgeMint(
        user1.address,
        testAmount,
        acgTxHash,
        requestId
      );
    });

    it("Should allow normal ERC20 transfers", async function () {
      const transferAmount = ethers.parseUnits("50", 8);
      
      await wrappedACG.connect(user1).transfer(user2.address, transferAmount);
      
      expect(await wrappedACG.balanceOf(user1.address)).to.equal(ethers.parseUnits("50", 8));
      expect(await wrappedACG.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should revert transfers when paused", async function () {
      await wrappedACG.connect(owner).pause();
      
      await expect(
        wrappedACG.connect(user1).transfer(user2.address, ethers.parseUnits("10", 8))
      ).to.be.revertedWithCustomError(wrappedACG, "EnforcedPause");
    });

    it("Should allow approve and transferFrom", async function () {
      const approveAmount = ethers.parseUnits("30", 8);
      
      await wrappedACG.connect(user1).approve(user2.address, approveAmount);
      expect(await wrappedACG.allowance(user1.address, user2.address)).to.equal(approveAmount);
      
      await wrappedACG.connect(user2).transferFrom(user1.address, user3.address, approveAmount);
      expect(await wrappedACG.balanceOf(user3.address)).to.equal(approveAmount);
    });
  });

  describe("Request Tracking", function () {
    it("Should track processed requests correctly", async function () {
      expect(await wrappedACG.isRequestProcessed(requestId)).to.be.false;
      
      await wrappedACG.connect(bridgeOperator).bridgeMint(
        user1.address,
        testAmount,
        acgTxHash,
        requestId
      );
      
      expect(await wrappedACG.isRequestProcessed(requestId)).to.be.true;
    });

    it("Should handle multiple unique requests", async function () {
      const requestId1 = ethers.keccak256(ethers.toUtf8Bytes("request-1"));
      const requestId2 = ethers.keccak256(ethers.toUtf8Bytes("request-2"));
      
      await wrappedACG.connect(bridgeOperator).bridgeMint(
        user1.address,
        testAmount,
        acgTxHash,
        requestId1
      );
      
      await wrappedACG.connect(bridgeOperator).bridgeMint(
        user2.address,
        testAmount,
        acgTxHash,
        requestId2
      );
      
      expect(await wrappedACG.isRequestProcessed(requestId1)).to.be.true;
      expect(await wrappedACG.isRequestProcessed(requestId2)).to.be.true;
    });
  });
}); 