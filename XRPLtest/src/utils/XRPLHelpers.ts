import { dropsToXrp, xrpToDrops, rippleTimeToUnixTime } from 'xrpl';

export class XRPLHelpers {
  /**
   * Convert drops to XRP
   */
  static dropsToXRP(drops: string): string {
    return dropsToXrp(drops);
  }

  /**
   * Convert XRP to drops
   */
  static xrpToDrops(xrp: string): string {
    return xrpToDrops(xrp);
  }

  /**
   * Convert Ripple time to ISO string
   */
  static rippleTimeToISOTime(rippleTime: number): string {
    const unixTime = rippleTimeToUnixTime(rippleTime);
    return new Date(unixTime * 1000).toISOString();
  }

  /**
   * Format RLUSD amount
   */
  static formatRLUSDAmount(amount: string | { currency: string; value: string; issuer: string }): string {
    if (typeof amount === 'string') {
      return amount;
    }
    return amount.value;
  }

  /**
   * Parse transaction amount
   */
  static parseTransactionAmount(tx: any): string {
    if (!tx.transaction.Amount) {
      return '0';
    }

    if (typeof tx.transaction.Amount === 'string') {
      return this.dropsToXRP(tx.transaction.Amount);
    }

    return this.formatRLUSDAmount(tx.transaction.Amount);
  }

  /**
   * Check if a transaction is a payment
   */
  static isPaymentTransaction(tx: any): boolean {
    return tx.transaction.TransactionType === 'Payment';
  }

  /**
   * Check if a transaction is successful
   */
  static isTransactionSuccessful(tx: any): boolean {
    return tx.meta?.TransactionResult === 'tesSUCCESS';
  }

  /**
   * Format transaction fee
   */
  static formatTransactionFee(tx: any): string {
    return this.dropsToXRP(tx.transaction.Fee || '0');
  }

  /**
   * Get transaction timestamp
   */
  static getTransactionTimestamp(tx: any): string {
    if (!tx.date) {
      return new Date().toISOString();
    }
    return this.rippleTimeToISOTime(tx.date);
  }

  /**
   * Create a memo for a transaction
   */
  static createTransactionMemo(text: string): any {
    return {
      Memos: [
        {
          Memo: {
            MemoType: Buffer.from('Description').toString('hex').toUpperCase(),
            MemoData: Buffer.from(text).toString('hex').toUpperCase()
          }
        }
      ]
    };
  }

  /**
   * Parse transaction memo
   */
  static parseTransactionMemo(tx: any): string | null {
    if (!tx.transaction.Memos || !tx.transaction.Memos.length) {
      return null;
    }

    try {
      const memoData = tx.transaction.Memos[0].Memo.MemoData;
      return Buffer.from(memoData, 'hex').toString('utf8');
    } catch (error) {
      return null;
    }
  }
} 