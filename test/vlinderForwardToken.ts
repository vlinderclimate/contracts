import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { VlinderForwardToken } from '../typechain-types';

describe('Vlinder Forward token', function () {
  function deployTokensFixture(
    forawardTotalSupply: number,
    settlementDate: number
  ) {
    return async function fixture() {
      const [owner, account1, account2, account3] = await ethers.getSigners();

      const ERC20Token = await ethers.getContractFactory(
        'ERC20PresetMinterPauser'
      );
      const erc20token = await ERC20Token.deploy('ERC20 Token', 'XXX');

      await erc20token.mint(owner.address, 1_000_000);

      const VlinderForwardToken = await ethers.getContractFactory(
        'VlinderForwardToken'
      );
      const vlinderForwardToken = (await upgrades.deployProxy(
        VlinderForwardToken,
        ['Vlinder Forward Token', 'XXX', settlementDate]
      )) as VlinderForwardToken;

      await vlinderForwardToken.deployed();

      await vlinderForwardToken.mint(owner.address, forawardTotalSupply);

      return {
        erc20token,
        vlinderForwardToken,
        owner,
        account1,
        account2,
        account3,
      };
    };
  }

  describe('Claim', function () {
    it('CO2 claim should be reverted if date is less than settlement date', async function () {
      const now = await time.latest();

      const ONE_HOUR_IN_SECS = 60 * 60;

      const { erc20token, vlinderForwardToken } = await loadFixture(
        deployTokensFixture(0, now + ONE_HOUR_IN_SECS)
      );

      expect(await vlinderForwardToken.settlementDate()).to.equal(
        now + ONE_HOUR_IN_SECS
      );

      await expect(
        vlinderForwardToken.claim(erc20token.address, 1)
      ).to.be.revertedWith('Settlement date is not yet reached');
    });

    it('CO2 claim should fail if insufficient balance', async function () {
      const { erc20token, vlinderForwardToken, owner } = await loadFixture(
        deployTokensFixture(10, await time.latest())
      );

      expect(await vlinderForwardToken.balanceOf(owner.address)).to.equal(10);

      await expect(
        vlinderForwardToken.claim(erc20token.address, 12)
      ).to.be.revertedWith('ERC20: burn amount exceeds balance');
    });

    it('CO2 can be claimed if total supply is equal to CO2 balance', async function () {
      const forwardTotalSupply = 3500;

      const { erc20token, vlinderForwardToken, account1, account2 } =
        await loadFixture(
          deployTokensFixture(forwardTotalSupply, await time.latest())
        );

      await vlinderForwardToken.transfer(account1.address, 1000);
      await vlinderForwardToken.transfer(account2.address, 2500);
      await erc20token.transfer(
        vlinderForwardToken.address,
        forwardTotalSupply
      );

      // should burn 500
      // should receive 500
      await vlinderForwardToken
        .connect(account1)
        .claim(erc20token.address, 500);

      expect(await vlinderForwardToken.balanceOf(account1.address)).to.equal(
        500
      );
      expect(await erc20token.balanceOf(account1.address)).to.equal(500);

      // should burn 2500
      // should receive 2500
      await vlinderForwardToken
        .connect(account2)
        .claim(erc20token.address, 2500);

      expect(await vlinderForwardToken.balanceOf(account2.address)).to.equal(0);
      expect(await erc20token.balanceOf(account2.address)).to.equal(2500);

      // should burn 500
      // should receive 500
      await vlinderForwardToken
        .connect(account1)
        .claim(erc20token.address, 500);

      expect(await vlinderForwardToken.balanceOf(account1.address)).to.equal(0);
      expect(await erc20token.balanceOf(account1.address)).to.equal(1000);
    });

    it('CO2 can be claimed if total supply is greater than CO2 balance', async function () {
      const forwardTotalSupply = 6800;
      const co2Amount = 6500;

      const { erc20token, vlinderForwardToken, account1, account2, account3 } =
        await loadFixture(
          deployTokensFixture(forwardTotalSupply, await time.latest())
        );

      await vlinderForwardToken.transfer(account1.address, 1000);
      await vlinderForwardToken.transfer(account2.address, 2500);
      await vlinderForwardToken.transfer(account3.address, 3300);

      await erc20token.transfer(vlinderForwardToken.address, co2Amount);

      // account 1 claims all (1000)
      // should burn 1000
      // should receive (6500 * 1000) / 6800 = 955
      await vlinderForwardToken
        .connect(account1)
        .claim(erc20token.address, 1000);

      expect(await vlinderForwardToken.balanceOf(account1.address)).to.equal(0);
      expect(await erc20token.balanceOf(account1.address)).to.equal(955);

      // account 2 claims half (1250)
      // should burn 1250
      // should receive (5545 * 1250) / 5800 = 1195
      await vlinderForwardToken
        .connect(account2)
        .claim(erc20token.address, 1250);

      expect(await vlinderForwardToken.balanceOf(account2.address)).to.equal(
        1250
      );
      expect(await erc20token.balanceOf(account2.address)).to.equal(1195);

      // account 3 claims all (3300)
      // should burn 3300
      // should receive (4350 * 3300) / 4550 = 3154
      await vlinderForwardToken
        .connect(account3)
        .claim(erc20token.address, 3300);

      expect(await vlinderForwardToken.balanceOf(account3.address)).to.equal(0);
      expect(await erc20token.balanceOf(account3.address)).to.equal(3154);

      // account 2 claims remained (1250)
      // should burn 1250
      // should receive (1196 * 1250) / 1250 = 1196
      await vlinderForwardToken
        .connect(account2)
        .claim(erc20token.address, 1250);

      expect(await vlinderForwardToken.balanceOf(account2.address)).to.equal(0);
      expect(await erc20token.balanceOf(account2.address)).to.equal(2391);
    });

    it('CO2 can be claimed if total supply is less than CO2 balance', async function () {
      const forwardTotalSupply = 6800;
      const co2Amount = 7000;

      const { erc20token, vlinderForwardToken, account1, account2, account3 } =
        await loadFixture(
          deployTokensFixture(forwardTotalSupply, await time.latest())
        );

      await vlinderForwardToken.transfer(account1.address, 1000);
      await vlinderForwardToken.transfer(account2.address, 2500);
      await vlinderForwardToken.transfer(account3.address, 3300);

      await erc20token.transfer(vlinderForwardToken.address, co2Amount);

      // account 1 claims all (1000)
      // should burn 1000
      // should receive (7000 * 1000) / 6800 = 1029
      await vlinderForwardToken
        .connect(account1)
        .claim(erc20token.address, 1000);

      expect(await vlinderForwardToken.balanceOf(account1.address)).to.equal(0);
      expect(await erc20token.balanceOf(account1.address)).to.equal(1029);

      // account 2 claims all (2500)
      // should burn 2500
      // should receive (5971 * 2500) / 5800 = 2573
      await vlinderForwardToken
        .connect(account2)
        .claim(erc20token.address, 2500);

      expect(await vlinderForwardToken.balanceOf(account2.address)).to.equal(0);
      expect(await erc20token.balanceOf(account2.address)).to.equal(2573);

      // account 3 claims all (3300)
      // should burn 3300
      // should receive (3398 * 3300) / 3300 = 3398
      await vlinderForwardToken
        .connect(account3)
        .claim(erc20token.address, 3300);

      expect(await vlinderForwardToken.balanceOf(account3.address)).to.equal(0);
      expect(await erc20token.balanceOf(account3.address)).to.equal(3398);
    });
  });
});
