import { Client, Wallet, EscrowCreate, EscrowFinish, EscrowCancel } from 'xrpl';
import { config } from '../config';

export interface CharityEscrow {
  id: string;
  donorAddress: string;
  charityAddress: string;
  amount: string;
  finishAfter: number;
  cancelAfter: number;
  campaignId: number;
  sequence?: number;
  status: 'pending' | 'ready' | 'completed' | 'expired' | 'cancelled';
}

export class CharityEscrowManager {
  private client: Client;
  private escrows: Map<string, CharityEscrow>;

  constructor(client: Client) {
    this.client = client;
    this.escrows = new Map();
  }

  /**
   * Update the status of all escrows based on current time
   */
  updateEscrowStatuses(): void {
    const now = Math.floor(Date.now() / 1000);
    
    for (const [id, escrow] of this.escrows) {
      if (escrow.status === 'pending') {
        if (now >= escrow.finishAfter && now < escrow.cancelAfter) {
          escrow.status = 'ready';
          console.log(`Escrow ${id} is now ready to be finished`);
        } else if (now >= escrow.cancelAfter) {
          escrow.status = 'expired';
          console.log(`Escrow ${id} has expired`);
        }
        this.escrows.set(id, escrow);
      }
    }
  }

  /**
   * Create a time-based charity escrow
   */
  async createEscrow(
    donorWallet: Wallet,
    charityAddress: string,
    amount: string,
    finishAfter: number,
    cancelAfter: number,
    campaignId: number
  ): Promise<CharityEscrow> {
    // Validate timing
    const now = Math.floor(Date.now() / 1000);
    if (finishAfter <= now) {
      throw new Error('FinishAfter time must be in the future');
    }
    if (cancelAfter <= finishAfter) {
      throw new Error('CancelAfter time must be after FinishAfter time');
    }

    // Check donor wallet balance
    const balance = await this.client.getXrpBalance(donorWallet.address);
    const amountInXRP = parseFloat(amount) / 1000000; // Convert drops to XRP
    const baseReserve = 10; // Base reserve requirement
    const ownerReserve = 2; // Owner reserve for the escrow object
    const requiredAmount = amountInXRP + baseReserve + ownerReserve;

    if (parseFloat(balance) < requiredAmount) {
      throw new Error(
        `Insufficient balance. Required: ${requiredAmount} XRP (${amountInXRP} XRP + ${baseReserve} XRP base reserve + ${ownerReserve} XRP owner reserve), Available: ${balance} XRP`
      );
    }

    // Create escrow record
    const escrow: CharityEscrow = {
      id: `${donorWallet.address}-${Date.now()}`,
      donorAddress: donorWallet.address,
      charityAddress,
      amount,
      finishAfter,
      cancelAfter,
      campaignId,
      status: 'pending'
    };

    try {
      // Prepare escrow creation transaction
      const escrowCreate: EscrowCreate = {
        TransactionType: "EscrowCreate",
        Account: donorWallet.address,
        Destination: charityAddress,
        Amount: amount,
        FinishAfter: finishAfter,
        CancelAfter: cancelAfter,
        DestinationTag: campaignId
      };

      // Submit escrow creation
      const prepared = await this.client.autofill(escrowCreate);
      const signed = donorWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta && typeof result.result.meta !== 'string') {
        if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`Escrow creation failed: ${result.result.meta.TransactionResult}`);
        }
      }

      // Store the sequence number for later use in finish/cancel
      escrow.sequence = prepared.Sequence;
      this.escrows.set(escrow.id, escrow);

      // Log success
      console.log(`Created charity escrow: ${escrow.id}`);
      console.log(`- Amount: ${amount} drops`);
      console.log(`- Finishable after: ${new Date(finishAfter * 1000).toISOString()}`);
      console.log(`- Expires after: ${new Date(cancelAfter * 1000).toISOString()}`);

      return escrow;
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  }

  /**
   * Finish an escrow after the FinishAfter time has passed
   */
  async finishEscrow(escrowId: string, finisherWallet: Wallet): Promise<void> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (!escrow.sequence) {
      throw new Error('Escrow sequence not found');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now < escrow.finishAfter) {
      throw new Error(`Escrow not yet finishable. Ready in ${escrow.finishAfter - now} seconds`);
    }

    if (now > escrow.cancelAfter) {
      escrow.status = 'expired';
      this.escrows.set(escrowId, escrow);
      throw new Error('Escrow has expired');
    }

    try {
      // Prepare finish transaction
      const escrowFinish: EscrowFinish = {
        TransactionType: "EscrowFinish",
        Account: finisherWallet.address,
        Owner: escrow.donorAddress,
        OfferSequence: escrow.sequence
      };

      // Submit finish transaction
      const prepared = await this.client.autofill(escrowFinish);
      const signed = finisherWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta && typeof result.result.meta !== 'string') {
        if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`Escrow finish failed: ${result.result.meta.TransactionResult}`);
        }
      }

      escrow.status = 'completed';
      this.escrows.set(escrowId, escrow);

      console.log(`Finished charity escrow: ${escrowId}`);
      console.log(`- Funds released to: ${escrow.charityAddress}`);
    } catch (error) {
      console.error('Error finishing escrow:', error);
      throw error;
    }
  }

  /**
   * Cancel an expired escrow
   */
  async cancelEscrow(escrowId: string, cancellerWallet: Wallet): Promise<void> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (!escrow.sequence) {
      throw new Error('Escrow sequence not found');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now < escrow.cancelAfter) {
      throw new Error(`Escrow not yet cancellable. Cancellable in ${escrow.cancelAfter - now} seconds`);
    }

    // Verify canceller is the donor
    if (cancellerWallet.address !== escrow.donorAddress) {
      throw new Error('Only the donor can cancel their escrow');
    }

    try {
      // Prepare cancel transaction
      const escrowCancel: EscrowCancel = {
        TransactionType: "EscrowCancel",
        Account: cancellerWallet.address,
        Owner: escrow.donorAddress,
        OfferSequence: escrow.sequence
      };

      // Submit cancel transaction
      const prepared = await this.client.autofill(escrowCancel);
      const signed = cancellerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta && typeof result.result.meta !== 'string') {
        if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`Escrow cancel failed: ${result.result.meta.TransactionResult}`);
        }
      }

      escrow.status = 'cancelled';
      this.escrows.set(escrowId, escrow);

      console.log(`Cancelled charity escrow: ${escrowId}`);
      console.log(`- Funds returned to: ${escrow.donorAddress}`);
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      throw error;
    }
  }

  /**
   * Get escrow details
   */
  getEscrow(escrowId: string): CharityEscrow | undefined {
    return this.escrows.get(escrowId);
  }

  /**
   * Get all escrows
   */
  getAllEscrows(): CharityEscrow[] {
    return Array.from(this.escrows.values());
  }
} 