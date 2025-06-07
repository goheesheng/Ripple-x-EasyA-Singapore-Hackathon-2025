import { WalletManager } from '../wallet/WalletManager';
import { CampaignManager } from '../campaigns/CampaignManager';

async function main() {
  try {
    // Initialize managers
    const walletManager = new WalletManager();
    console.log('Connecting to XRPL Testnet...');
    await walletManager.connect();

    // Get issuer wallet
    const issuerWallet = walletManager.getIssuerWallet();
    
    console.log('\n=== RLUSD Issuer Wallet ===');
    if (issuerWallet) {
      console.log('Address:', issuerWallet.address);
      console.log('Secret/Seed:', issuerWallet.seed);
    } else {
      console.log('No issuer wallet found');
    }

    // Create a test charity wallet
    console.log('\n=== Test Charity Wallet ===');
    const charityWallet = await walletManager.createFundedTestWallet();
    console.log('Address:', charityWallet.address);
    console.log('Secret/Seed:', charityWallet.seed);

    // Create a test donor wallet
    console.log('\n=== Test Donor Wallet ===');
    const donorWallet = await walletManager.createFundedTestWallet();
    console.log('Address:', donorWallet.address);
    console.log('Secret/Seed:', donorWallet.seed);

    // Initialize CampaignManager
    const campaignManager = new CampaignManager(walletManager);
    
    // Create a test campaign
    console.log('\n=== Creating Test Campaign ===');
    const campaign = await campaignManager.createCampaign(
      charityWallet,
      'Test Campaign',
      'Test Description',
      '1000',
      30
    );
    
    console.log('\n=== Campaign Details ===');
    console.log('Campaign ID:', campaign.id);
    console.log('Charity Address:', campaign.charityWallet.address);
    console.log('Charity Secret/Seed:', campaign.charityWallet.seed);
    console.log('Target Amount:', campaign.targetAmount, 'RLUSD');
    console.log('Status:', campaign.status);

    // List all active campaigns
    console.log('\n=== All Active Campaigns ===');
    const campaigns = campaignManager.listCampaigns();
    campaigns.forEach((c, index) => {
      console.log(`\nCampaign ${index + 1}:`);
      console.log('ID:', c.id);
      console.log('Name:', c.name);
      console.log('Charity Address:', c.charityWallet.address);
      console.log('Charity Secret/Seed:', c.charityWallet.seed);
      console.log('Status:', c.status);
      console.log('Progress:', c.currentAmount + '/' + c.targetAmount, 'RLUSD');
    });

    await walletManager.disconnect();
    console.log('\nDisconnected from XRPL network');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 