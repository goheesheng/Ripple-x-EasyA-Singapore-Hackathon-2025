import { WalletManager } from '../src/wallet/WalletManager';
import { CampaignManager } from '../src/campaigns/CampaignManager';
import { Wallet } from 'xrpl';

describe('CampaignManager', () => {
  let walletManager: WalletManager;
  let campaignManager: CampaignManager;
  let charityWallet: Wallet;

  beforeAll(async () => {
    walletManager = new WalletManager();
    campaignManager = new CampaignManager(walletManager);
    await walletManager.connect();
  });

  beforeEach(async () => {
    charityWallet = await walletManager.createFundedTestWallet();
    await walletManager.createRLUSDTrustLine(charityWallet);
  });

  afterAll(async () => {
    await walletManager.disconnect();
  });

  describe('createCampaign', () => {
    it('should create a new campaign with valid parameters', async () => {
      const campaign = await campaignManager.createCampaign(
        charityWallet,
        'Test Campaign',
        'Test Description',
        '1000',
        30
      );

      expect(campaign).toBeDefined();
      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.description).toBe('Test Description');
      expect(campaign.targetAmount).toBe('1000');
      expect(campaign.status).toBe('active');
      expect(campaign.charityWallet.address).toBe(charityWallet.address);
    });

    it('should throw error for invalid target amount', async () => {
      await expect(
        campaignManager.createCampaign(
          charityWallet,
          'Test Campaign',
          'Test Description',
          '0',
          30
        )
      ).rejects.toThrow();
    });

    it('should throw error for invalid duration', async () => {
      await expect(
        campaignManager.createCampaign(
          charityWallet,
          'Test Campaign',
          'Test Description',
          '1000',
          0
        )
      ).rejects.toThrow();
    });
  });

  describe('donate', () => {
    it('should process donation for active campaign', async () => {
      const campaign = await campaignManager.createCampaign(
        charityWallet,
        'Test Campaign',
        'Test Description',
        '1000',
        30
      );

      const donorWallet = await walletManager.createFundedTestWallet();
      await walletManager.createRLUSDTrustLine(donorWallet);

      await campaignManager.donate(campaign.id, donorWallet, '100');
      
      const updatedCampaign = campaignManager.getCampaign(campaign.id);
      expect(updatedCampaign?.currentAmount).toBe('100');
    });

    it('should update campaign status when target is reached', async () => {
      const campaign = await campaignManager.createCampaign(
        charityWallet,
        'Test Campaign',
        'Test Description',
        '100',
        30
      );

      const donorWallet = await walletManager.createFundedTestWallet();
      await walletManager.createRLUSDTrustLine(donorWallet);

      await campaignManager.donate(campaign.id, donorWallet, '100');
      
      const updatedCampaign = campaignManager.getCampaign(campaign.id);
      expect(updatedCampaign?.status).toBe('completed');
    });

    it('should throw error for non-existent campaign', async () => {
      const donorWallet = await walletManager.createFundedTestWallet();
      await expect(
        campaignManager.donate('non-existent-id', donorWallet, '100')
      ).rejects.toThrow('Campaign not found');
    });
  });

  describe('getCampaignBalance', () => {
    it('should return correct campaign balance', async () => {
      const campaign = await campaignManager.createCampaign(
        charityWallet,
        'Test Campaign',
        'Test Description',
        '1000',
        30
      );

      const balance = await campaignManager.getCampaignBalance(campaign.id);
      expect(balance).toBeDefined();
    });

    it('should throw error for non-existent campaign', async () => {
      await expect(
        campaignManager.getCampaignBalance('non-existent-id')
      ).rejects.toThrow('Campaign not found');
    });
  });
}); 