import { Client, Wallet, Payment, Transaction, TransactionMetadata } from 'xrpl';
import { config } from '../config';
import { WalletManager } from '../wallet/WalletManager';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  targetAmount: string;
  deadline: number;
  charityWallet: Wallet;
  currentAmount: string;
  status: 'active' | 'completed' | 'expired';
}

export class CampaignManager {
  private campaigns: Map<string, Campaign>;
  private walletManager: WalletManager;

  constructor(walletManager: WalletManager) {
    this.campaigns = new Map();
    this.walletManager = walletManager;
  }

  /**
   * Create a new charity campaign
   */
  async createCampaign(
    charityWallet: Wallet,
    name: string,
    description: string,
    targetAmount: string,
    durationInDays: number
  ): Promise<Campaign> {
    // Validate inputs
    if (!name || !description) {
      throw new Error('Campaign name and description are required');
    }

    const targetAmountNum = parseFloat(targetAmount);
    if (isNaN(targetAmountNum) || targetAmountNum < parseFloat(config.campaign.minFundingTarget) || 
        targetAmountNum > parseFloat(config.campaign.maxFundingTarget)) {
      throw new Error(`Target amount must be between ${config.campaign.minFundingTarget} and ${config.campaign.maxFundingTarget} RLUSD`);
    }

    const durationInSeconds = durationInDays * 24 * 60 * 60;
    if (durationInSeconds < config.campaign.minDuration || durationInSeconds > config.campaign.maxDuration) {
      throw new Error(`Campaign duration must be between ${config.campaign.minDuration / 86400} and ${config.campaign.maxDuration / 86400} days`);
    }

    // Create campaign object
    const campaign: Campaign = {
      id: `${charityWallet.address}-${Date.now()}`,
      name,
      description,
      targetAmount,
      deadline: Math.floor(Date.now() / 1000) + durationInSeconds,
      charityWallet,
      currentAmount: '0',
      status: 'active'
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  /**
   * Make a donation to a campaign
   */
  async donate(
    campaignId: string,
    donorWallet: Wallet,
    amount: string
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new Error(`Campaign is ${campaign.status}`);
    }

    if (Date.now() / 1000 > campaign.deadline) {
      campaign.status = 'expired';
      throw new Error('Campaign has expired');
    }

    const client = this.walletManager.getClient();
    const issuerWallet = this.walletManager.getIssuerWallet();

    if (!issuerWallet) {
      throw new Error('RLUSD issuer not set up');
    }

    try {
      // Verify donor has sufficient balance
      const donorLines = await client.request({
        command: 'account_lines',
        account: donorWallet.address,
        peer: issuerWallet.address
      });

      const donorLine = donorLines.result.lines.find(
        (line: any) => line.currency === config.rlusd.currency
      );

      if (!donorLine) {
        throw new Error('Donor has no RLUSD trust line');
      }

      const donorBalance = parseFloat(donorLine.balance);
      if (donorBalance < parseFloat(amount)) {
        throw new Error(`Insufficient RLUSD balance. Available: ${donorBalance}, Required: ${amount}`);
      }

      // Verify charity wallet has trust line
      const charityLines = await client.request({
        command: 'account_lines',
        account: campaign.charityWallet.address,
        peer: issuerWallet.address
      });

      const charityLine = charityLines.result.lines.find(
        (line: any) => line.currency === config.rlusd.currency
      );

      if (!charityLine) {
        // Set up trust line for charity wallet if it doesn't exist
        await this.walletManager.createRLUSDTrustLine(campaign.charityWallet);
        
        // Verify trust line was created
        const verifyLines = await client.request({
          command: 'account_lines',
          account: campaign.charityWallet.address,
          peer: issuerWallet.address
        });

        if (!verifyLines.result.lines.some((line: any) => line.currency === config.rlusd.currency)) {
          throw new Error('Failed to create charity wallet trust line');
        }
      }

      // Prepare payment transaction
      const payment: Payment = {
        TransactionType: "Payment",
        Account: donorWallet.address,
        Destination: campaign.charityWallet.address,
        Amount: {
          currency: config.rlusd.currency,
          value: amount,
          issuer: issuerWallet.address
        }
      };

      // Submit payment
      const prepared = await client.autofill(payment);
      const signed = donorWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta && typeof result.result.meta !== 'string') {
        const meta = result.result.meta as TransactionMetadata;
        if (meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`Payment failed: ${meta.TransactionResult}`);
        }
      } else {
        throw new Error('Invalid transaction metadata received');
      }

      // Verify the payment was successful by checking balances
      const verifyCharityLines = await client.request({
        command: 'account_lines',
        account: campaign.charityWallet.address,
        peer: issuerWallet.address
      });

      const verifyCharityLine = verifyCharityLines.result.lines.find(
        (line: any) => line.currency === config.rlusd.currency
      );

      if (!verifyCharityLine) {
        throw new Error('Failed to verify payment: charity trust line not found');
      }

      // Update campaign amount
      const newAmount = (parseFloat(campaign.currentAmount) + parseFloat(amount)).toString();
      campaign.currentAmount = newAmount;

      // Check if campaign target has been reached
      if (parseFloat(newAmount) >= parseFloat(campaign.targetAmount)) {
        campaign.status = 'completed';
      }

      console.log(`Successfully donated ${amount} RLUSD to campaign ${campaignId}`);

    } catch (error) {
      throw new Error(`Donation failed: ${error}`);
    }
  }

  /**
   * Get campaign details
   */
  getCampaign(campaignId: string): Campaign | undefined {
    return this.campaigns.get(campaignId);
  }

  /**
   * List all campaigns
   */
  listCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  /**
   * Update campaign status based on current time
   */
  updateCampaignStatus(campaignId: string): void {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const now = Math.floor(Date.now() / 1000);
    if (campaign.status === 'active' && now > campaign.deadline) {
      campaign.status = 'expired';
    }
  }

  /**
   * Get campaign balance
   */
  async getCampaignBalance(campaignId: string): Promise<string> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const issuerWallet = this.walletManager.getIssuerWallet();
    if (!issuerWallet) {
      throw new Error('RLUSD issuer not set up');
    }

    try {
      const client = this.walletManager.getClient();
      const response = await client.request({
        command: 'account_lines',
        account: campaign.charityWallet.address,
        ledger_index: 'validated'
      });

      const rlusdTrustLine = response.result.lines.find(
        (line: any) => 
          line.currency === config.rlusd.currency && 
          line.account === issuerWallet.address
      );

      return rlusdTrustLine ? rlusdTrustLine.balance : '0';
    } catch (error) {
      throw new Error(`Failed to get campaign balance: ${error}`);
    }
  }
} 