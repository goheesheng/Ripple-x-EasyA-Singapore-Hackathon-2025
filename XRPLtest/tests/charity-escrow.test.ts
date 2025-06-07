import { Client, Wallet, xrpToDrops } from 'xrpl';
import { config } from '../src/config';
import { WalletManager } from '../src/wallet/WalletManager';
import { CharityEscrowManager } from '../src/campaigns/XRPEscrow';

describe('Charity Escrow Tests', () => {
  let client: Client;
  let walletManager: WalletManager;
  let escrowManager: CharityEscrowManager;
  let donorWallet: Wallet;
  let charityWallet: Wallet;

  // Increase the timeout for the entire test suite
  jest.setTimeout(90000);

  beforeAll(async () => {
    try {
      // Initialize wallet manager and connect
      walletManager = new WalletManager();
      await walletManager.connect();
      
      // Get the client from wallet manager to ensure we're using the same connection
      client = walletManager.getClient();
      
      // Create test wallets with proper waiting between operations
      donorWallet = await walletManager.createFundedTestWallet();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between wallet creations
      
      charityWallet = await walletManager.createFundedTestWallet();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for wallet setup to complete
      
      // Initialize escrow manager with the same client
      escrowManager = new CharityEscrowManager(client);

      // Verify both wallets are properly funded
      const donorBalance = await client.getXrpBalance(donorWallet.address);
      const charityBalance = await client.getXrpBalance(charityWallet.address);

      console.log('Test setup complete:');
      console.log(`Donor wallet ${donorWallet.address} balance: ${donorBalance} XRP`);
      console.log(`Charity wallet ${charityWallet.address} balance: ${charityBalance} XRP`);

      // Ensure donor has enough XRP for tests
      if (parseFloat(donorBalance) < 50) { // Increased minimum balance requirement
        console.log('Funding donor wallet with additional XRP');
        const fundResult = await client.fundWallet(donorWallet);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fund again to ensure enough balance
        const fundResult2 = await client.fundWallet(donorWallet);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newBalance = await client.getXrpBalance(donorWallet.address);
        console.log(`Donor wallet new balance: ${newBalance} XRP`);
      }
    } catch (error) {
      console.error('Test setup failed:', error);
      // Ensure cleanup even if setup fails
      if (walletManager && walletManager.isConnectedToNetwork()) {
        await walletManager.disconnect();
      }
      throw error;
    }
  });

  afterAll(async () => {
    try {
      if (walletManager && walletManager.isConnectedToNetwork()) {
        await walletManager.disconnect();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  test('Create and finish time-based charity escrow', async () => {
    const donationAmountXRP = '2'; // Reduced amount for testing
    const donationAmountDrops = xrpToDrops(donationAmountXRP);
    const campaignId = 12345;

    try {
      // Get initial balances
      const initialDonorBalance = await client.getXrpBalance(donorWallet.address);
      const initialCharityBalance = await client.getXrpBalance(charityWallet.address);
      console.log('Initial balances:');
      console.log(`Donor: ${initialDonorBalance} XRP`);
      console.log(`Charity: ${initialCharityBalance} XRP`);

      // Calculate escrow timing (using shorter periods for testing)
      const now = Math.floor(Date.now() / 1000);
      const finishAfter = now + 5; // Finishable after 5 seconds
      const cancelAfter = now + 30; // Cancellable after 30 seconds

      // Create escrow
      const escrow = await escrowManager.createEscrow(
        donorWallet,
        charityWallet.address,
        donationAmountDrops,
        finishAfter,
        cancelAfter,
        campaignId
      );

      expect(escrow).toBeDefined();
      expect(escrow.status).toBe('pending');
      expect(escrow.amount).toBe(donationAmountDrops);

      // Wait until escrow is finishable (add buffer time)
      console.log('Waiting for escrow to become finishable...');
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Update escrow statuses
      escrowManager.updateEscrowStatuses();
      const readyEscrow = escrowManager.getEscrow(escrow.id);
      expect(readyEscrow?.status).toBe('ready');

      // Finish the escrow
      await escrowManager.finishEscrow(escrow.id, charityWallet);

      // Wait for ledger to settle
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify escrow was completed
      const finishedEscrow = escrowManager.getEscrow(escrow.id);
      expect(finishedEscrow?.status).toBe('completed');

      // Verify charity received the funds
      const finalCharityBalance = await client.getXrpBalance(charityWallet.address);
      const balanceIncrease = parseFloat(finalCharityBalance) - parseFloat(initialCharityBalance);
      console.log('Final balances:');
      console.log(`Charity: ${finalCharityBalance} XRP (increase: ${balanceIncrease} XRP)`);
      
      // Allow for some transaction fee variance
      expect(balanceIncrease).toBeGreaterThan(parseFloat(donationAmountXRP) - 1);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  test('Create and cancel expired charity escrow', async () => {
    const donationAmountXRP = '1'; // Reduced amount for testing
    const donationAmountDrops = xrpToDrops(donationAmountXRP);
    const campaignId = 12346;

    try {
      // Get initial balances
      const initialDonorBalance = await client.getXrpBalance(donorWallet.address);
      const initialCharityBalance = await client.getXrpBalance(charityWallet.address);
      console.log('Initial balances:');
      console.log(`Donor: ${initialDonorBalance} XRP`);
      console.log(`Charity: ${initialCharityBalance} XRP`);

      // Calculate escrow timing (using shorter periods for testing)
      const now = Math.floor(Date.now() / 1000);
      const finishAfter = now + 5; // Finishable after 5 seconds
      const cancelAfter = now + 10; // Cancellable after 10 seconds

      // Create escrow
      const escrow = await escrowManager.createEscrow(
        donorWallet,
        charityWallet.address,
        donationAmountDrops,
        finishAfter,
        cancelAfter,
        campaignId
      );

      expect(escrow).toBeDefined();
      expect(escrow.status).toBe('pending');

      // Wait until escrow is cancellable (add buffer time)
      console.log('Waiting for escrow to become cancellable...');
      await new Promise(resolve => setTimeout(resolve, 11000));

      // Update escrow statuses
      escrowManager.updateEscrowStatuses();
      const expiredEscrow = escrowManager.getEscrow(escrow.id);
      expect(expiredEscrow?.status).toBe('expired');

      // Cancel the escrow using the donor wallet
      await escrowManager.cancelEscrow(escrow.id, donorWallet);

      // Wait for ledger to settle
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify escrow was cancelled
      const cancelledEscrow = escrowManager.getEscrow(escrow.id);
      expect(cancelledEscrow?.status).toBe('cancelled');

      // Verify donor got their funds back (minus transaction fees)
      const finalDonorBalance = await client.getXrpBalance(donorWallet.address);
      const balanceDifference = Math.abs(parseFloat(initialDonorBalance) - parseFloat(finalDonorBalance));
      console.log('Final balances:');
      console.log(`Donor: ${finalDonorBalance} XRP (difference: ${balanceDifference} XRP)`);
      
      // Allow for transaction fees (should be less than 1 XRP)
      expect(balanceDifference).toBeLessThan(1);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });
}); 