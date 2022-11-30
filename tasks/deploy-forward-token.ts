import { task, types } from 'hardhat/config';

// hardhat deploy-forward --network matic --name "<name>" --symbol "<symbol>" --settlement "0"

task('deploy-forward', 'Deploys vlider forward token')
  .addParam('name', 'Token name')
  .addParam('symbol', 'Token symbol')
  .addParam('settlement', 'Settlement date UNIX timestamp', 0, types.int)
  .setAction(async (taskArgs, { ethers, upgrades }) => {
    const VlinderForwardToken = await ethers.getContractFactory(
      'VlinderForwardToken'
    );

    const vlinderForwardToken = await upgrades.deployProxy(
      VlinderForwardToken,
      [taskArgs.name, taskArgs.symbol, taskArgs.settlement]
    );

    await vlinderForwardToken.deployed();

    console.log(
      `Forward token ${taskArgs.name} - ${taskArgs.symbol} is deployed! ${vlinderForwardToken.address}`
    );
  });
