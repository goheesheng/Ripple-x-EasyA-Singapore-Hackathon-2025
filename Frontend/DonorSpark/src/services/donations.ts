import { Client } from 'xrpl';

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

export interface Donation {
  campaignId: string;
  donorAddress: string;
  amount: number;
  txHash: string;
  createdAt: string;
  campaignTitle?: string;
  organizationName?: string;
}

// Store donation in database after successful transaction
const storeDonationInDatabase = async (
  campaignId: string,
  donorAddress: string,
  amount: number,
  txHash: string
): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3001/api/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        campaignId,
        donorAddress,
        amount,
        txHash
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Donation stored in database:', result);
  } catch (error) {
    console.error('❌ Failed to store donation in database:', error);
    throw error;
  }
};

// Wait for transaction validation
const waitForTransactionValidation = async (txHash: string, maxWaitTime: number = 30000): Promise<any> => {
  const client = new Client(TESTNET_URL, {
    connectionTimeout: 10000,
    timeout: 20000
  });

  try {
    console.log('🔗 Connecting to XRPL to verify donation transaction...');
    await client.connect();
    
    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        console.log(`🔍 Checking transaction validation for: ${txHash}`);
        
        const txResponse = await client.request({
          command: 'tx',
          transaction: txHash
        });
        
        if (txResponse.result && txResponse.result.validated) {
          console.log('✅ Donation transaction validated on XRPL!');
          return {
            validated: true,
            transaction: txResponse.result
          };
        }
      } catch (error) {
        console.log('⏳ Transaction not found yet, continuing to poll...');
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error(`Transaction validation timeout after ${maxWaitTime}ms`);
    
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
};

// Process donation with XRPL transaction
export const processDonation = async (
  campaignId: string,
  campaignWalletAddress: string,
  amount: number,
  donorAddress: string
): Promise<{ success: boolean; txHash?: string; message: string }> => {
  try {
    console.log('💰 Processing donation:', {
      campaignId,
      campaignWalletAddress,
      amount,
      donorAddress
    });

    // Check if Crossmark is available
    if (typeof window === 'undefined' || !window.crossmark) {
      throw new Error('Crossmark extension not found. Please install Crossmark to make donations.');
    }

    // Create payment transaction
    const transaction = {
      TransactionType: 'Payment',
      Account: donorAddress,
      Destination: campaignWalletAddress,
      Amount: (amount * 1000000).toString(), // Convert to drops (1 XRP = 1,000,000 drops)
      Memos: [{
        Memo: {
          MemoData: Buffer.from(JSON.stringify({
            type: 'donation',
            campaign_id: campaignId,
            amount: amount,
            timestamp: new Date().toISOString()
          })).toString('hex').toUpperCase(),
          MemoFormat: Buffer.from('text/plain').toString('hex').toUpperCase(),
          MemoType: Buffer.from('donation').toString('hex').toUpperCase()
        }
      }]
    };

    console.log('📤 Submitting donation transaction via Crossmark...');
    
    // Sign and submit transaction
    const response = await window.crossmark.methods.signAndSubmit(transaction);
    
    if (!response) {
      throw new Error('No response received from Crossmark');
    }

    if (response.error) {
      if (response.error === 'cancelled') {
        throw new Error('Donation was cancelled by user');
      }
      throw new Error(response.error);
    }

    if (!response.result?.hash) {
      throw new Error('No transaction hash received');
    }

    const txHash = response.result.hash;
    console.log('✅ Transaction submitted with hash:', txHash);

    // Wait for transaction validation
    console.log('⏳ Waiting for transaction validation on XRPL...');
    const validatedTransaction = await waitForTransactionValidation(txHash);

    if (validatedTransaction.validated) {
      console.log('✅ Transaction validated! Storing donation in database...');
      
      // Store donation in database
      await storeDonationInDatabase(campaignId, donorAddress, amount, txHash);
      
      return {
        success: true,
        txHash,
        message: 'Donation processed successfully!'
      };
    } else {
      throw new Error('Transaction failed validation');
    }

  } catch (error) {
    console.error('❌ Donation processing failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

// Get donations for a campaign
export const getCampaignDonations = async (campaignId: string): Promise<Donation[]> => {
  try {
    const response = await fetch(`http://localhost:3001/api/campaigns/${campaignId}/donations`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.donations || [];
  } catch (error) {
    console.error('Failed to fetch campaign donations:', error);
    return [];
  }
};

// Get donations by donor address
export const getDonorDonations = async (donorAddress: string): Promise<Donation[]> => {
  try {
    const response = await fetch(`http://localhost:3001/api/donations/donor/${donorAddress}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.donations || [];
  } catch (error) {
    console.error('Failed to fetch donor donations:', error);
    return [];
  }
}; 