import { Client, Wallet } from 'xrpl';
import { config } from '../src/config';
import { WalletManager } from '../src/wallet/WalletManager';
import { RLUSDEscrowManager } from '../src/campaigns/RLUSDEscrow';

describe('RLUSD Escrow Tests', () => {
  let client: Client;
  let walletManager: WalletManager;
  let escrowManager: RLUSDEscrowManager;
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

    // Initialize escrow manager
    escrowManager = new RLUSDEscrowManager(client, issuerWallet);

    console.log('Test setup complete:');
    console.log('- Donor wallet:', donorWallet.address);
    console.log('- Charity wallet:', charityWallet.address);
    console.log('- Issuer wallet:', issuerWallet.address);
  });

  afterAll(async () => {
    await client.disconnect();
  });

  test('Create and finish RLUSD escrow', async () => {
    const donationAmount = '1000';
    const campaignId = 12345;

    // Calculate escrow timing (using shorter periods for testing)
    const now = Math.floor(Date.now() / 1000);
    const finishAfter = now + 60; // Finishable after 1 minute
    const cancelAfter = now + 120; // Cancellable after 2 minutes

    // Create escrow
    const escrow = await escrowManager.createEscrow(
      donorWallet,
      charityWallet.address,
      donationAmount,
      finishAfter,
      cancelAfter,
      campaignId
    );

    expect(escrow).toBeDefined();
    expect(escrow.status).toBe('pending');
    expect(escrow.amount).toBe(donationAmount);

    // Verify escrow was created
    const createdEscrow = escrowManager.getEscrow(escrow.id);
    expect(createdEscrow).toBeDefined();
    expect(createdEscrow?.status).toBe('pending');

    // Wait until escrow is finishable
    console.log('Waiting for escrow to become finishable...');
    await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds

    // Finish the escrow
    await escrowManager.finishEscrow(escrow.id);

    // Verify escrow was completed
    const finishedEscrow = escrowManager.getEscrow(escrow.id);
    expect(finishedEscrow?.status).toBe('completed');

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
  }, 180000); // Set timeout to 3 minutes

  test('Create and cancel RLUSD escrow', async () => {
    const donationAmount = '500';
    const campaignId = 12346;

    // Calculate escrow timing (using shorter periods for testing)
    const now = Math.floor(Date.now() / 1000);
    const finishAfter = now + 60; // Finishable after 1 minute
    const cancelAfter = now + 90; // Cancellable after 1.5 minutes

    // Get initial donor balance
    const initialDonorLines = await client.request({
      command: 'account_lines',
      account: donorWallet.address,
      peer: issuerWallet.address
    });

    const initialDonorBalance = initialDonorLines.result.lines.find(
      (line: any) => line.currency === config.rlusd.currency
    )?.balance || '0';

    // Create escrow
    const escrow = await escrowManager.createEscrow(
      donorWallet,
      charityWallet.address,
      donationAmount,
      finishAfter,
      cancelAfter,
      campaignId
    );

    expect(escrow).toBeDefined();
    expect(escrow.status).toBe('pending');

    // Wait until escrow is cancellable
    console.log('Waiting for escrow to become cancellable...');
    await new Promise(resolve => setTimeout(resolve, 95000)); // Wait 95 seconds

    // Cancel the escrow
    await escrowManager.cancelEscrow(escrow.id);

    // Verify escrow was cancelled
    const cancelledEscrow = escrowManager.getEscrow(escrow.id);
    expect(cancelledEscrow?.status).toBe('cancelled');

    // Verify donor got their funds back
    const finalDonorLines = await client.request({
      command: 'account_lines',
      account: donorWallet.address,
      peer: issuerWallet.address
    });

    const finalDonorBalance = finalDonorLines.result.lines.find(
      (line: any) => line.currency === config.rlusd.currency
    )?.balance || '0';

    expect(parseFloat(finalDonorBalance)).toBeGreaterThanOrEqual(parseFloat(initialDonorBalance));
  }, 180000); // Set timeout to 3 minutes
}); 