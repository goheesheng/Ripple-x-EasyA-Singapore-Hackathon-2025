import { Client, Wallet, xrpToDrops, EscrowCreate, EscrowFinish, EscrowCancel, Payment } from 'xrpl';
import { config } from '../src/config';
import { WalletManager } from '../src/wallet/WalletManager';

describe('Charity Escrow Tests', () => {
  let client: Client;
  let walletManager: WalletManager;
  let donorWallet: Wallet;
  let charityWallet: Wallet;
  let issuerWallet: Wallet;

  beforeAll(async () => {
    // Initialize client and connect
    client = new Client(config.xrpl.server);
    await client.connect();

    // Set up wallets
    walletManager = new WalletManager();
    await walletManager.connect();

    // Create test wallets
    donorWallet = await walletManager.createFundedTestWallet();
    charityWallet = await walletManager.createFundedTestWallet();
    
    // Get issuer wallet
    issuerWallet = walletManager.getIssuerWallet()!;

    // Set up trust lines
    await walletManager.createRLUSDTrustLine(donorWallet);
    await walletManager.createRLUSDTrustLine(charityWallet);

    // Issue some RLUSD to donor for testing
    const payment: Payment = {
      TransactionType: "Payment",
      Account: issuerWallet.address,
      Destination: donorWallet.address,
      Amount: {
        currency: config.rlusd.currency,
        value: "10000",
        issuer: issuerWallet.address
      }
    };

    const prepared = await client.autofill(payment);
    const signed = issuerWallet.sign(prepared);
    await client.submitAndWait(signed.tx_blob);
  });

  afterAll(async () => {
    await client.disconnect();
  });

  test('Create and finish time-based charity escrow', async () => {
    const donationAmount = '1000';
    const campaignId = 12345;

    // Calculate escrow timing (using shorter periods for testing)
    const now = new Date();
    const finishAfter = new Date(now.getTime() + 60000); // 1 minute from now
    const cancelAfter = new Date(now.getTime() + 120000); // 2 minutes from now

    // Create escrow transaction
    const escrowCreate: EscrowCreate = {
      TransactionType: "EscrowCreate",
      Account: donorWallet.address,
      Amount: xrpToDrops(donationAmount), // Convert to drops for XRP escrow
      Destination: charityWallet.address,
      FinishAfter: Math.floor(finishAfter.getTime() / 1000),
      CancelAfter: Math.floor(cancelAfter.getTime() / 1000),
      DestinationTag: campaignId
    };

    // Submit escrow creation
    const preparedCreate = await client.autofill(escrowCreate);
    const signedCreate = donorWallet.sign(preparedCreate);
    const resultCreate = await client.submitAndWait(signedCreate.tx_blob);

    expect(resultCreate.result.meta).toBeDefined();
    if (resultCreate.result.meta && typeof resultCreate.result.meta !== 'string') {
      expect(resultCreate.result.meta.TransactionResult).toBe('tesSUCCESS');
    }

    // Get sequence number of created escrow
    const escrowSequence = preparedCreate.Sequence?.toString();
    expect(escrowSequence).toBeDefined();

    // Wait until after FinishAfter time
    console.log('Waiting for escrow to become finishable...');
    await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds

    // Finish the escrow
    const escrowFinish: EscrowFinish = {
      TransactionType: "EscrowFinish",
      Account: charityWallet.address,
      Owner: donorWallet.address,
      OfferSequence: escrowSequence!
    };

    // Submit escrow finish
    const preparedFinish = await client.autofill(escrowFinish);
    const signedFinish = charityWallet.sign(preparedFinish);
    const resultFinish = await client.submitAndWait(signedFinish.tx_blob);

    expect(resultFinish.result.meta).toBeDefined();
    if (resultFinish.result.meta && typeof resultFinish.result.meta !== 'string') {
      expect(resultFinish.result.meta.TransactionResult).toBe('tesSUCCESS');
    }

    // Verify charity received the funds
    const charityLines = await client.request({
      command: 'account_lines',
      account: charityWallet.address,
      peer: issuerWallet.address
    });

    const charityBalance = charityLines.result.lines.find(
      (line: any) => line.currency === config.rlusd.currency
    )?.balance || '0';

    expect(parseFloat(charityBalance)).toBeGreaterThanOrEqual(parseFloat(donationAmount));
  }, 180000); // Set timeout to 3 minutes to account for escrow timing
}); 