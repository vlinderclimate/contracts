require('dotenv').config();
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import './tasks/deploy-forward-token';
import './tasks/deploy-carbon-franc';

const { API_URL, PRIVATE_KEY, VLINDER_DEV_KEY, POLYGONSCAN_API_KEY } =
  process.env;

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    matic: {
      url: API_URL,
      accounts: [PRIVATE_KEY!],
    },
    'vlinder-dev': {
      url: API_URL,
      accounts: [VLINDER_DEV_KEY!],
    },
  },
  etherscan: {
    apiKey: POLYGONSCAN_API_KEY,
  },
};

export default config;
