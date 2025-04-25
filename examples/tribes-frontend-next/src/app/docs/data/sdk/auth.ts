export const authModule = {
  title: "Authentication Module",
  description: "The Authentication module provides methods for authenticating users and managing their sessions within the Tribes ecosystem.",
  methods: [
    {
      name: "connectWallet",
      description: "Connects a user's wallet to the SDK and establishes authentication",
      parameters: [
        {
          name: "signer",
          type: "ethers.Signer",
          description: "An ethers.js Signer instance from the user's wallet",
          optional: false
        }
      ],
      returns: {
        type: "Promise<{ address: string; isConnected: boolean }>",
        description: "A promise that resolves to the connected wallet address and connection status"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';
import { ethers } from 'ethers';

// Connect using ethers provider
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Connect wallet
const connection = await tribes.auth.connectWallet(signer);
console.log("Connected address:", connection.address);`
    },
    {
      name: "disconnectWallet",
      description: "Disconnects the currently connected wallet",
      parameters: [],
      returns: {
        type: "Promise<boolean>",
        description: "A promise that resolves to true if disconnection was successful"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Disconnect wallet
const success = await tribes.auth.disconnectWallet();
if (success) {
  console.log("Wallet disconnected successfully");
}`
    },
    {
      name: "getWalletConnection",
      description: "Gets the current wallet connection status",
      parameters: [],
      returns: {
        type: "Promise<{ address: string | null; isConnected: boolean }>",
        description: "A promise that resolves to the connection status and address if connected"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Check connection status
const connection = await tribes.auth.getWalletConnection();
if (connection.isConnected) {
  console.log("Connected to wallet:", connection.address);
} else {
  console.log("No wallet connected");
}`
    },
    {
      name: "signMessage",
      description: "Signs a message with the connected wallet for verification purposes",
      parameters: [
        {
          name: "message",
          type: "string",
          description: "The message to sign",
          optional: false
        }
      ],
      returns: {
        type: "Promise<{ signature: string; address: string }>",
        description: "A promise that resolves to the signature and the address that signed it"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Sign a message for verification
const message = "Sign this message to verify your ownership of this wallet";
const { signature, address } = await tribes.auth.signMessage(message);
console.log("Signature:", signature);
console.log("Address:", address);`
    }
  ]
}; 