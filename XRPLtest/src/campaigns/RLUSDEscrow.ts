import { Client, Wallet, Payment } from 'xrpl';
import { config } from '../config';

export interface RLUSDEscrow {
  id: string;
  donorAddress: string;
  charityAddress: string;
  amount: string;
  finishAfter: number;
  cancelAfter: number;
  campaignId: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export class RLUSDEscrowManager {
  private client: Client;
  private escrows: Map<string, RLUSDEscrow>;
  private issuerWallet: Wallet;

  constructor(client: Client, issuerWallet: Wallet) {
    this.client = client;
    this.issuerWallet = issuerWallet;
    this.escrows = new Map();
  }

  async createEscrow(
    donorWallet: Wallet,
    charityAddress: string,
    amount: string,
    finishAfter: number,
    cancelAfter: number,
    campaignId: number
  ): Promise<RLUSDEscrow> {
    // First, verify donor has sufficient RLUSD
    const donorLines = await this.client.request({
      command: 'account_lines',
      account: donorWallet.address,
      peer: this.issuerWallet.address
    });

    const donorBalance = donorLines.result.lines.find(
      (line: any) => line.currency === config.rlusd.currency
    )?.balance;

    if (!donorBalance || parseFloat(donorBalance) < parseFloat(amount)) {
      throw new Error('Insufficient RLUSD balance');
    }

    // Create escrow record
    const escrow: RLUSDEscrow = {
      id: `${donorWallet.address}-${Date.now()}`,
      donorAddress: donorWallet.address,
      charityAddress,
      amount,
      finishAfter,
      cancelAfter,
      campaignId,
      status: 'pending'
    };

    // Hold the RLUSD by transferring to issuer's special escrow account
    const payment: Payment = {
      TransactionType: "Payment",
      Account: donorWallet.address,
      Destination: this.issuerWallet.address,
      Amount: {
        currency: config.rlusd.currency,
        value: amount,
        issuer: this.issuerWallet.address
      },
      DestinationTag: campaignId // Use destination tag to track the escrow
    };

    const prepared = await this.client.autofill(payment);
    const signed = donorWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta !== 'string') {
      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Payment failed: ${result.result.meta.TransactionResult}`);
      }
    }

    this.escrows.set(escrow.id, escrow);
    return escrow;
  }

  async finishEscrow(escrowId: string): Promise<void> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== 'pending') {
      throw new Error(`Escrow is ${escrow.status}`);
    }

    if (Date.now() / 1000 < escrow.finishAfter) {
      throw new Error('Escrow is not yet finishable');
    }

    if (Date.now() / 1000 > escrow.cancelAfter) {
      throw new Error('Escrow has expired');
    }

    // Release RLUSD to charity
    const payment: Payment = {
      TransactionType: "Payment",
      Account: this.issuerWallet.address,
      Destination: escrow.charityAddress,
      Amount: {
        currency: config.rlusd.currency,
        value: escrow.amount,
        issuer: this.issuerWallet.address
      },
      SourceTag: escrow.campaignId
    };

    const prepared = await this.client.autofill(payment);
    const signed = this.issuerWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta !== 'string') {
      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Payment failed: ${result.result.meta.TransactionResult}`);
      }
    }

    escrow.status = 'completed';
    this.escrows.set(escrowId, escrow);
  }

  async cancelEscrow(escrowId: string): Promise<void> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== 'pending') {
      throw new Error(`Escrow is ${escrow.status}`);
    }

    if (Date.now() / 1000 < escrow.cancelAfter) {
      throw new Error('Escrow is not yet cancellable');
    }

    // Return RLUSD to donor
    const payment: Payment = {
      TransactionType: "Payment",
      Account: this.issuerWallet.address,
      Destination: escrow.donorAddress,
      Amount: {
        currency: config.rlusd.currency,
        value: escrow.amount,
        issuer: this.issuerWallet.address
      },
      SourceTag: escrow.campaignId
    };

    const prepared = await this.client.autofill(payment);
    const signed = this.issuerWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta !== 'string') {
      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Payment failed: ${result.result.meta.TransactionResult}`);
      }
    }

    escrow.status = 'cancelled';
    this.escrows.set(escrowId, escrow);
  }

  // Helper method to get escrow details
  getEscrow(escrowId: string): RLUSDEscrow | undefined {
    return this.escrows.get(escrowId);
  }

  // Helper method to get all escrows
  getAllEscrows(): RLUSDEscrow[] {
    return Array.from(this.escrows.values());
  }
} 