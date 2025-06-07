import { Client, Wallet, TrustSet, Transaction, TransactionMetadata, Payment, AccountSet } from 'xrpl';
import { config } from '../config';

export class WalletManager {
  private client: Client;
  private issuerWallet: Wallet | null = null;
  private isConnected: boolean = false;
  private retryAttempts: number = 3;
  private retryDelay: number = 2000; // 2 seconds

  constructor() {
    this.client = new Client(config.xrpl.server);
  }

  /**
   * Connect to the XRPL network with retry mechanism
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await this.client.connect();
        this.isConnected = true;
        console.log('Connected to XRPL testnet:', config.xrpl.server);
        
        // Wait for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Set up issuer wallet
        await this.setupIssuerWallet();
        return;
      } catch (error) {
        console.error(`Connection attempt ${attempt} failed:`, error);
        if (attempt < this.retryAttempts) {
          console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw new Error(`Failed to connect after ${this.retryAttempts} attempts: ${error}`);
        }
      }
    }
  }

  /**
   * Set up the RLUSD issuer wallet with retry mechanism
   */
  private async setupIssuerWallet(): Promise<void> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        if (!this.isConnected) {
          throw new Error('Not connected to XRPL network');
        }

        // Create a new issuer wallet
        const fundResult = await this.client.fundWallet();
        const issuer = fundResult.wallet;
        const balance = fundResult.balance;

        // Wait for funding to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.issuerWallet = issuer;
        config.rlusd.issuer = issuer.address;

        // Set DefaultRipple flag on issuer account
        const accountSet: AccountSet = {
          TransactionType: "AccountSet",
          Account: issuer.address,
          SetFlag: 8, // Enable rippling
          Flags: 0
        };

        const prepared = await this.client.autofill(accountSet);
        const signed = issuer.sign(prepared);
        const result = await this.client.submitAndWait(signed.tx_blob);

        if (result.result.meta && typeof result.result.meta !== 'string') {
          if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
            throw new Error(`AccountSet failed: ${result.result.meta.TransactionResult}`);
          }
        }

        console.log('Created RLUSD issuer wallet:', issuer.address);
        console.log('Issuer wallet balance:', balance, 'XRP');
        return;

      } catch (error) {
        console.error(`Issuer wallet setup attempt ${attempt} failed:`, error);
        if (attempt < this.retryAttempts) {
          console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw new Error(`Failed to set up issuer wallet after ${this.retryAttempts} attempts: ${error}`);
        }
      }
    }
  }

  /**
   * Disconnect from the XRPL network
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Create a new funded test wallet with retry mechanism and balance verification
   */
  async createFundedTestWallet(): Promise<Wallet> {
    if (!this.isConnected) {
      throw new Error('Not connected to XRPL network');
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const fundResult = await this.client.fundWallet();
        const wallet = fundResult.wallet;
        
        // Wait for funding to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify the wallet exists and has funds
        try {
          const balance = await this.client.getXrpBalance(wallet.address);
          console.log(`Created and funded wallet ${wallet.address} with ${balance} XRP`);
          return wallet;
        } catch (error) {
          if (attempt === this.retryAttempts) {
            throw new Error(`Failed to verify wallet balance: ${error}`);
          }
          // If verification fails, try again
          continue;
        }
      } catch (error) {
        console.error(`Wallet creation attempt ${attempt} failed:`, error);
        if (attempt < this.retryAttempts) {
          console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw new Error(`Failed to create funded wallet after ${this.retryAttempts} attempts: ${error}`);
        }
      }
    }
    throw new Error('Failed to create funded wallet');
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
   * Create a trust line for RLUSD with retry mechanism
   */
  async createRLUSDTrustLine(wallet: Wallet, limit: string = config.rlusd.defaultLimit): Promise<void> {
    if (!this.issuerWallet) {
      throw new Error('Issuer wallet not set up');
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
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
          if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
            throw new Error(`TrustSet failed: ${result.result.meta.TransactionResult}`);
          }
        }

        // Wait for trust line to be established
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Issue initial RLUSD
        await this.issueRLUSD(wallet.address, '10000');

        console.log(`Created trust line and issued RLUSD to ${wallet.address}`);
        return;

      } catch (error) {
        console.error(`Trust line creation attempt ${attempt} failed:`, error);
        if (attempt < this.retryAttempts) {
          console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw new Error(`Failed to create trust line after ${this.retryAttempts} attempts: ${error}`);
        }
      }
    }
  }

  /**
   * Issue RLUSD to an account with retry mechanism
   */
  private async issueRLUSD(destination: string, amount: string): Promise<void> {
    if (!this.issuerWallet) {
      throw new Error('Issuer wallet not set up');
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
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
          if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
            throw new Error(`RLUSD issuance failed: ${result.result.meta.TransactionResult}`);
          }
        }

        console.log(`Issued ${amount} RLUSD to ${destination}`);
        return;

      } catch (error) {
        console.error(`RLUSD issuance attempt ${attempt} failed:`, error);
        if (attempt < this.retryAttempts) {
          console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw new Error(`Failed to issue RLUSD after ${this.retryAttempts} attempts: ${error}`);
        }
      }
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

  /**
   * Check if connected to the network
   */
  isConnectedToNetwork(): boolean {
    return this.isConnected && this.client.isConnected();
  }
} 