import { WalletManager } from '../src/wallet/WalletManager';
import { CampaignManager } from '../src/campaigns/CampaignManager';
import { EventListener } from '../src/subscriptions/EventListener';
import { XRPLHelpers } from '../src/utils/XRPLHelpers';

async function main() {
  try {
    // Initialize managers
    const walletManager = new WalletManager();
    const campaignManager = new CampaignManager(walletManager);
    const eventListener = new EventListener(walletManager, campaignManager);

    // Connect to XRPL network
    await walletManager.connect();
    console.log('Connected to XRPL network');

    // Create charity and donor test wallets
    const charityWallet = await walletManager.createFundedTestWallet();
    const donorWallet = await walletManager.createFundedTestWallet();
    
    console.log('Created test wallets:');
    console.log('Charity wallet address:', charityWallet.address);
    console.log('Donor wallet address:', donorWallet.address);

    // Set up RLUSD trust lines
    await walletManager.createRLUSDTrustLine(charityWallet);
    await walletManager.createRLUSDTrustLine(donorWallet);
    console.log('Created RLUSD trust lines');

    // Create a campaign
    const campaign = await campaignManager.createCampaign(
      charityWallet,
      'Save the Trees',
      'Help us plant 1000 trees in urban areas',
      '1000',  // 1000 RLUSD target
      30       // 30 days duration
    );
    
    console.log('Created campaign:', campaign);

    // Subscribe to campaign updates
    await eventListener.subscribeCampaign(campaign.id, (update) => {
      console.log('Campaign update:', {
        transactionType: update.transaction.transaction.TransactionType,
        amount: XRPLHelpers.parseTransactionAmount(update.transaction),
        newBalance: update.campaignBalance,
        status: update.campaign?.status
      });
    });

    // Make a test donation
    console.log('Making test donation...');
    await campaignManager.donate(campaign.id, donorWallet, '100');  // Donate 100 RLUSD

    // Get campaign balance
    const balance = await campaignManager.getCampaignBalance(campaign.id);
    console.log('Current campaign balance:', balance, 'RLUSD');

    // Clean up
    await eventListener.unsubscribeAll();
    await walletManager.disconnect();
    console.log('Disconnected from XRPL network');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main(); 