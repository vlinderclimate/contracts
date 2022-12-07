import { task, types } from 'hardhat/config';

// hardhat deploy-forward --network matic --name "<name>" --symbol "<symbol>" --settlement <unix>

task('deploy-forward', 'Deploys vlider forward token')
  .addParam('name', 'Token name')
  .addParam('symbol', 'Token symbol')
  .addParam('description', 'Token description')
  .addParam('settlement', 'Settlement date UNIX timestamp', 0, types.int)
  .setAction(async (taskArgs, { ethers, upgrades }) => {
    const VlinderForwardToken = await ethers.getContractFactory(
      'VlinderForwardToken'
    );

    const vlinderForwardToken = await upgrades.deployProxy(
      VlinderForwardToken,
      [
        taskArgs.name,
        taskArgs.symbol,
        taskArgs.description,
        taskArgs.settlement,
      ]
    );

    await vlinderForwardToken.deployed();

    console.log(
      `Forward token ${taskArgs.name} - ${taskArgs.symbol} is deployed! ${vlinderForwardToken.address}`
    );
  });

task('mint-forward', 'Mint vlider forward token')
  .addParam('address', 'Token address')
  .addParam('to', 'Mint to address')
  .addParam('amount', 'Amount in tokens')
  .setAction(async (taskArgs, { ethers }) => {
    const contract = await ethers.getContractAt(
      'VlinderForwardToken',
      taskArgs.address
    );

    const decimals = await contract.decimals();

    await contract.mint(
      taskArgs.to,
      ethers.utils.parseUnits(taskArgs.amount, decimals)
    );
  });
