import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none",
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    flashTestnet: {
      url: "https://rpc.flash.fuse.io",
      chainId: 1264453517,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 5000000000, // 5 gwei
    },
    monadDevnet: {
      url: "https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a",
      chainId: 20143,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 52000000000 // 52 gwei
    },
    // Add other networks as needed
    // Example:
    // goerli: {
    //   url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    // }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    outputFile: "reports/gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: ["test"],
    showMethodSig: true,
    showTimeSpent: true
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  },
  paths: {
    sources: "contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    // Add the reports path to store test reports
    root: "./"
  },
  mocha: {
    timeout: 60000, // Increase timeout to 60 seconds
    reporter: 'spec',
    reporterOptions: {
      showDiff: true,
      symbols: {
        success: '✓',
        pending: '⟡',
        failure: '✖'
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

export default config; 