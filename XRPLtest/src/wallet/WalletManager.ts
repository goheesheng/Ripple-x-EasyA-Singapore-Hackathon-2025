import { Client, Wallet, TrustSet, Transaction, TransactionMetadata, Payment, AccountSet } from 'xrpl';
import { config } from '../config';

export class WalletManager {
  private client: Client;
  private issuerWallet: Wallet | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client(config.xrpl.server);
  }

  /**
   * Connect to the XRPL network
   */
  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
        this.isConnected = true;
        console.log('Connected to XRPL testnet:', config.xrpl.server);
        
        // Wait a moment to ensure connection is stable
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set up issuer wallet on connection
        await this.setupIssuerWallet();
      }
    } catch (error) {
      this.isConnected = false;
      console.error('Connection error:', error);
      throw new Error(`Failed to connect to XRPL network: ${error}`);
    }
  }

  /**
   * Set up the RLUSD issuer wallet
   */
  private async setupIssuerWallet(): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to XRPL network');
      }

      // Create a new issuer wallet
      const fundResult = await this.client.fundWallet();
      const issuer = fundResult.wallet;
      const balance = fundResult.balance;

      this.issuerWallet = issuer;
      
      // Update the config with the new issuer address
      config.rlusd.issuer = issuer.address;

      // Wait a moment before setting account flags
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set DefaultRipple flag on issuer account to allow rippling
      const accountSet: AccountSet = {
        TransactionType: "AccountSet",
        Account: issuer.address,
        SetFlag: 8, // Enable rippling
        Flags: 0
      };

      const prepared = await this.client.autofill(accountSet);
      const signed = issuer.sign(prepared);
      await this.client.submitAndWait(signed.tx_blob);

      console.log('Created RLUSD issuer wallet:', issuer.address);
      console.log('Issuer wallet balance:', balance, 'XRP');
    } catch (error) {
      console.error('Error in setupIssuerWallet:', error);
      throw new Error(`Failed to set up issuer wallet: ${error}`);
    }
  }

  /**
   * Disconnect from the XRPL network
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /**
   * Create a new funded test wallet
   */
  async createFundedTestWallet(): Promise<Wallet> {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to XRPL network');
      }

      const fundResult = await this.client.fundWallet();
      console.log('Created new test wallet:', fundResult.wallet.address);
      console.log('Initial balance:', fundResult.balance, 'XRP');
      return fundResult.wallet;
    } catch (error) {
      console.error('Error in createFundedTestWallet:', error);
      throw new Error(`Failed to create funded test wallet: ${error}`);
    }
  }

  /**
   * Create a wallet from a seed
   */
  createWalletFromSeed(seed: string): Wallet {
    try {
      return Wallet.fromSeed(seed);
    } catch (error) {
      throw new Error(`Failed to create wallet from seed: ${error}`);
    }
  }

  /**
   * Get account info for a wallet
   */
  async getAccountInfo(wallet: Wallet): Promise<any> {
    try {
      const response = await this.client.request({
        command: 'account_info',
        account: wallet.address,
        ledger_index: 'validated'
      });
      return response.result.account_data;
    } catch (error) {
      throw new Error(`Failed to get account info: ${error}`);
    }
  }

  /**
   * Create a trust line for RLUSD
   */
  async createRLUSDTrustLine(wallet: Wallet, limit: string = config.rlusd.defaultLimit): Promise<void> {
    if (!this.issuerWallet) {
      throw new Error('Issuer wallet not set up');
    }

    try {
      // Check if trust line already exists
      const lines = await this.client.request({
        command: 'account_lines',
        account: wallet.address,
        peer: this.issuerWallet.address
      });

      const existingLine = lines.result.lines.find(
        (line: any) => line.currency === config.rlusd.currency
      );

      if (existingLine) {
        console.log(`Trust line already exists for ${wallet.address}`);
        // Ensure wallet has some RLUSD for testing
        const balance = parseFloat(existingLine.balance);
        if (balance < 1000) {
          await this.issueRLUSD(wallet.address, '10000');
        }
        return;
      }

      // Create trust line
      const trustSet: TrustSet = {
        TransactionType: "TrustSet",
        Account: wallet.address,
        LimitAmount: {
          currency: config.rlusd.currency,
          issuer: this.issuerWallet.address,
          value: limit
        }
      };

      const prepared = await this.client.autofill(trustSet);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta && typeof result.result.meta !== 'string') {
        const meta = result.result.meta as TransactionMetadata;
        if (meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`TrustSet failed: ${meta.TransactionResult}`);
        }
      } else {
        throw new Error('Invalid transaction metadata received');
      }

      // Wait a moment for the trust line to be established
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify trust line was created
      const verifyLines = await this.client.request({
        command: 'account_lines',
        account: wallet.address,
        peer: this.issuerWallet.address
      });

      const verifyLine = verifyLines.result.lines.find(
        (line: any) => line.currency === config.rlusd.currency
      );

      if (!verifyLine) {
        throw new Error('Trust line verification failed');
      }

      // Issue initial RLUSD
      await this.issueRLUSD(wallet.address, '10000');

      console.log(`Created trust line and issued RLUSD to ${wallet.address}`);
    } catch (error) {
      throw new Error(`Failed to create RLUSD trust line: ${error}`);
    }
  }

  /**
   * Issue RLUSD to an account
   */
  private async issueRLUSD(destination: string, amount: string): Promise<void> {
    if (!this.issuerWallet) {
      throw new Error('Issuer wallet not set up');
    }

    try {
      const payment: Payment = {
        TransactionType: "Payment",
        Account: this.issuerWallet.address,
        Destination: destination,
        Amount: {
          currency: config.rlusd.currency,
          value: amount,
          issuer: this.issuerWallet.address
        }
      };

      const prepared = await this.client.autofill(payment);
      const signed = this.issuerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta && typeof result.result.meta !== 'string') {
        const meta = result.result.meta as TransactionMetadata;
        if (meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`RLUSD issuance failed: ${meta.TransactionResult}`);
        }
      } else {
        throw new Error('Invalid transaction metadata received');
      }

      console.log(`Issued ${amount} RLUSD to ${destination}`);
    } catch (error) {
      throw new Error(`Failed to issue RLUSD: ${error}`);
    }
  }

  /**
   * Get the client instance
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get the issuer wallet
   */
  getIssuerWallet(): Wallet | null {
    return this.issuerWallet;
  }
} 