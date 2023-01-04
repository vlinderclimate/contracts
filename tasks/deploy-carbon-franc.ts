import { task } from 'hardhat/config';

// hardhat deploy-carbon-franc --network matic
// hardhat verify --network matic <address>
// hardhat mint-carbon-franc --network matic --address "<address>" --to "<to>" --amount <amount>

task('deploy-carbon-franc', 'Deploys Carbon Franc').setAction(
  async (_, { ethers, upgrades }) => {
    const CarbonFranc = await ethers.getContractFactory('CarbonFranc');

    const carbonFranc = await upgrades.deployProxy(CarbonFranc);

    await carbonFranc.deployed();

    console.log(`Carbon Franc is deployed! ${carbonFranc.address}`);
  }
);

task('mint-carbon-franc', 'Mint Carbon Franc')
  .addParam('address', 'Token address')
  .addParam('to', 'Mint to address')
  .addParam('amount', 'Amount in tokens')
  .setAction(async (taskArgs, { ethers }) => {
    const contract = await ethers.getContractAt(
      'CarbonFranc',
      taskArgs.address
    );

    const decimals = await contract.decimals();

    await contract.mint(
      taskArgs.to,
      ethers.utils.parseUnits(taskArgs.amount, decimals)
    );
  });
