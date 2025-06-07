import { Client, Wallet, TrustSet, Payment } from 'xrpl';
import { config } from '../config';
import { WalletManager } from '../wallet/WalletManager';

async function main() {
  try {
    // Initialize WalletManager
    const walletManager = new WalletManager();
    console.log('Connecting to XRPL Testnet...');
    await walletManager.connect();

    // Get the target wallet address
    const targetAddress = 'raPeFkekHdpKkSEavQfu7C8iQstFX9EtDA';

    // Create trust line for the target address
    console.log('Setting up trust line for target address...');
    
    // First, ensure the target wallet has enough XRP for the trust line
    const client = walletManager.getClient();
    const issuerWallet = walletManager.getIssuerWallet();
    
    if (!issuerWallet) {
      throw new Error('Failed to get issuer wallet');
    }

    // Check if target account exists and fund it if needed
    try {
      await client.request({
        command: 'account_info',
        account: targetAddress,
        ledger_index: 'validated'
      });
    } catch (error) {
      console.log('Target account not found or not enough XRP. Funding account...');
      // Create a new wallet for funding
      const fundResult = await client.fundWallet();
      const fundingWallet = fundResult.wallet;

      // Send XRP to target address
      const xrpPayment: Payment = {
        TransactionType: "Payment",
        Account: fundingWallet.address,
        Destination: targetAddress,
        Amount: "20000000" // 20 XRP
      };

      const preparedXrpPayment = await client.autofill(xrpPayment);
      const signedXrpPayment = fundingWallet.sign(preparedXrpPayment);
      await client.submitAndWait(signedXrpPayment.tx_blob);
      console.log('Funded target account with 20 XRP');
    }

    // Create trust line transaction
    const trustSet: TrustSet = {
      TransactionType: "TrustSet",
      Account: targetAddress,
      LimitAmount: {
        currency: config.rlusd.currency,
        issuer: issuerWallet.address,
        value: "1000000000" // High limit to ensure enough capacity
      }
    };

    // Submit trust line transaction
    const preparedTrust = await client.autofill(trustSet);
    const targetWallet = Wallet.fromSeed(process.env.TARGET_SEED || '');
    const signedTrust = targetWallet.sign(preparedTrust);
    await client.submitAndWait(signedTrust.tx_blob);

    console.log('Trust line created successfully');

    // Send RLUSD to the target address
    console.log('Sending 10000 RLUSD to target address...');
    const payment: Payment = {
      TransactionType: "Payment",
      Account: issuerWallet.address,
      Destination: targetAddress,
      Amount: {
        currency: config.rlusd.currency,
        value: "10000",
        issuer: issuerWallet.address
      }
    };

    const preparedPayment = await client.autofill(payment);
    const signedPayment = issuerWallet.sign(preparedPayment);
    const result = await client.submitAndWait(signedPayment.tx_blob);

    if (result.result.meta && typeof result.result.meta !== 'string') {
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        console.log('Successfully sent 10000 RLUSD to', targetAddress);
      } else {
        throw new Error(`Payment failed: ${result.result.meta.TransactionResult}`);
      }
    }

    // Verify the balance
    const lines = await client.request({
      command: 'account_lines',
      account: targetAddress,
      peer: issuerWallet.address
    });

    const rlusdLine = lines.result.lines.find(
      (line: any) => line.currency === config.rlusd.currency
    );

    console.log('Current RLUSD balance:', rlusdLine ? rlusdLine.balance : '0');

    // Cleanup
    await walletManager.disconnect();
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 