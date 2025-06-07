import { Client, Wallet } from 'xrpl';
import { config } from '../config';

async function main() {
  try {
    // Connect to XRPL Testnet
    const client = new Client(config.xrpl.server);
    await client.connect();
    console.log('Connected to XRPL Testnet');

    // Generate a new wallet
    const { wallet } = await client.fundWallet();
    
    console.log('\nWallet created successfully!');
    console.log('Address:', wallet.address);
    console.log('Seed:', wallet.seed);
    console.log('\nIMPORTANT: Save the seed! You will need it to set the TARGET_SEED environment variable.');
    console.log('Run this command before deploying RLUSD:');
    console.log(`$env:TARGET_SEED="${wallet.seed}"`);

    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 