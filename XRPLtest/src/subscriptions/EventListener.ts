import { Client, Payment, Transaction } from 'xrpl';
import { WalletManager } from '../wallet/WalletManager';
import { CampaignManager } from '../campaigns/CampaignManager';

interface TransactionEvent {
  transaction: {
    TransactionType: string;
    Destination?: string;
    Account: string;
    Amount?: string | {
      currency: string;
      value: string;
      issuer: string;
    };
  };
  type: string;
  engine_result: string;
  meta: any;
}

export class EventListener {
  private walletManager: WalletManager;
  private campaignManager: CampaignManager;

  constructor(walletManager: WalletManager, campaignManager: CampaignManager) {
    this.walletManager = walletManager;
    this.campaignManager = campaignManager;
  }

  /**
   * Subscribe to ledger close events
   */
  async subscribeLedger(callback: (ledgerIndex: number) => void): Promise<void> {
    const client = this.walletManager.getClient();

    try {
      await client.request({
        command: 'subscribe',
        streams: ['ledger']
      });

      client.on('ledgerClosed', (ledger) => {
        callback(ledger.ledger_index);
      });
    } catch (error) {
      throw new Error(`Failed to subscribe to ledger: ${error}`);
    }
  }

  /**
   * Subscribe to account transactions
   */
  async subscribeAccount(address: string, callback: (tx: TransactionEvent) => void): Promise<void> {
    const client = this.walletManager.getClient();

    try {
      await client.request({
        command: 'subscribe',
        accounts: [address]
      });

      client.connection.on('transaction', (tx: TransactionEvent) => {
        if (tx.transaction.Destination === address) {
          callback(tx);
        }
      });
    } catch (error) {
      throw new Error(`Failed to subscribe to account: ${error}`);
    }
  }

  /**
   * Subscribe to campaign updates
   */
  async subscribeCampaign(campaignId: string, callback: (tx: any) => void): Promise<void> {
    const campaign = this.campaignManager.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Subscribe to the campaign wallet's transactions
    await this.subscribeAccount(campaign.charityWallet.address, async (tx) => {
      // Update campaign status
      this.campaignManager.updateCampaignStatus(campaignId);

      // Get updated balance
      const balance = await this.campaignManager.getCampaignBalance(campaignId);
      
      // Call the callback with transaction and updated campaign info
      callback({
        transaction: tx,
        campaignBalance: balance,
        campaign: this.campaignManager.getCampaign(campaignId)
      });
    });
  }

  /**
   * Subscribe to payment stream
   */
  async subscribePayments(callback: (payment: TransactionEvent) => void): Promise<void> {
    const client = this.walletManager.getClient();

    try {
      await client.request({
        command: 'subscribe',
        streams: ['transactions']
      });

      client.connection.on('transaction', (tx: TransactionEvent) => {
        if (tx.transaction.TransactionType === 'Payment') {
          callback(tx);
        }
      });
    } catch (error) {
      throw new Error(`Failed to subscribe to payments: ${error}`);
    }
  }

  /**
   * Unsubscribe from all streams
   */
  async unsubscribeAll(): Promise<void> {
    const client = this.walletManager.getClient();

    try {
      await client.request({
        command: 'unsubscribe',
        streams: ['ledger', 'transactions']
      });

      client.connection.removeAllListeners('transaction');
      client.removeAllListeners('ledgerClosed');
    } catch (error) {
      throw new Error(`Failed to unsubscribe: ${error}`);
    }
  }
} 