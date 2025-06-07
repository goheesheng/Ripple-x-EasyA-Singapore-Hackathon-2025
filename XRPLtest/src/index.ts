import { WalletManager } from './wallet/WalletManager';
import { CampaignManager } from './campaigns/CampaignManager';
import { EventListener } from './subscriptions/EventListener';
import { XRPLHelpers } from './utils/XRPLHelpers';

async function main() {
  try {
    console.log('Starting XRPL Charity Campaign System...');

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
    const issuerWallet = walletManager.getIssuerWallet();
    
    if (!issuerWallet) {
      throw new Error('Failed to get issuer wallet');
    }
    
    console.log('\nWallet Information:');
    console.log('=== RLUSD Issuer Wallet ===');
    console.log('Address:', issuerWallet.address);
    console.log('Secret/Seed:', issuerWallet.seed);
    
    console.log('\n=== Charity Wallet ===');
    console.log('Address:', charityWallet.address);
    console.log('Secret/Seed:', charityWallet.seed);
    
    console.log('\n=== Donor Wallet ===');
    console.log('Address:', donorWallet.address);
    console.log('Secret/Seed:', donorWallet.seed);

    // Set up RLUSD trust lines
    console.log('\nSetting up trust lines...');
    await walletManager.createRLUSDTrustLine(charityWallet);
    await walletManager.createRLUSDTrustLine(donorWallet);
    console.log('Created RLUSD trust lines');

    // Create a campaign
    console.log('\nCreating test campaign...');
    const campaign = await campaignManager.createCampaign(
      charityWallet,
      'Save the Trees',
      'Help us plant 1000 trees in urban areas',
      '1000',  // 1000 RLUSD target
      30       // 30 days duration
    );
    
    console.log('\nCampaign created:');
    console.log('- ID:', campaign.id);
    console.log('- Name:', campaign.name);
    console.log('- Target:', campaign.targetAmount, 'RLUSD');
    console.log('- Status:', campaign.status);
    console.log('- Charity Wallet:', campaign.charityWallet.address);
    console.log('- Charity Secret:', campaign.charityWallet.seed);

    // Subscribe to campaign updates
    console.log('\nSubscribing to campaign updates...');
    await eventListener.subscribeCampaign(campaign.id, (update) => {
      console.log('\nCampaign update received:');
      console.log('- Transaction type:', update.transaction.transaction.TransactionType);
      console.log('- Amount:', XRPLHelpers.parseTransactionAmount(update.transaction), 'RLUSD');
      console.log('- New balance:', update.campaignBalance, 'RLUSD');
      console.log('- Status:', update.campaign?.status);
    });

    // Make a test donation
    console.log('\nMaking test donation...');
    await campaignManager.donate(campaign.id, donorWallet, '100');  // Donate 100 RLUSD
    console.log('Donation processed successfully');

    // Get campaign balance
    const balance = await campaignManager.getCampaignBalance(campaign.id);
    console.log('\nCurrent campaign balance:', balance, 'RLUSD');

    // List all campaigns
    console.log('\nAll active campaigns:');
    const campaigns = campaignManager.listCampaigns();
    campaigns.forEach(c => {
      console.log('- Campaign:', c.name);
      console.log('  Status:', c.status);
      console.log('  Progress:', c.currentAmount + '/' + c.targetAmount, 'RLUSD');
      console.log('  Charity Address:', c.charityWallet.address);
      console.log('  Charity Secret:', c.charityWallet.seed);
    });

    // Clean up
    console.log('\nCleaning up...');
    await eventListener.unsubscribeAll();
    await walletManager.disconnect();
    console.log('Disconnected from XRPL network');

  } catch (error) {
    console.error('\nError:', error);
  }
}

// Run the demo
main(); 