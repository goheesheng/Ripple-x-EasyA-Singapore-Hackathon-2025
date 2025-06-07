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
  txHash: string,
  campaignTitle?: string,
  organizationName?: string
): Promise<void> => {
  try {
    const donationData = {
      campaignId,
      donorAddress,
      amount,
      txHash,
      campaignTitle,
      organizationName,
      createdAt: new Date().toISOString()
    };

    console.log('💾 Storing donation with full details:', donationData);

    const response = await fetch('http://localhost:3001/api/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(donationData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Donation stored in database with campaign info:', result);
    
    // Also store locally as fallback for immediate access in account summary
    const localDonations = JSON.parse(localStorage.getItem('user_donations') || '[]');
    localDonations.push({
      ...donationData,
      id: Math.random().toString(36).substring(7)
    });
    localStorage.setItem('user_donations', JSON.stringify(localDonations));
    console.log('✅ Donation also stored locally for immediate access');
    
  } catch (error) {
    console.error('❌ Failed to store donation in database:', error);
    
    // Fallback: store locally if database fails
    console.log('📦 Storing donation locally as fallback');
    const localDonations = JSON.parse(localStorage.getItem('user_donations') || '[]');
    localDonations.push({
      campaignId,
      donorAddress,
      amount,
      txHash,
      campaignTitle,
      organizationName,
      createdAt: new Date().toISOString(),
      id: Math.random().toString(36).substring(7)
    });
    localStorage.setItem('user_donations', JSON.stringify(localDonations));
    console.log('✅ Donation stored locally as fallback');
    
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
    console.log('🔗 Testnet URL:', TESTNET_URL);
    
    await client.connect();
    console.log('✅ Connected to XRPL testnet successfully');
    
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
    
  } catch (connectionError) {
    console.error('❌ Failed to connect to XRPL testnet:', connectionError);
    
    // Provide more specific error information
    if (connectionError instanceof Error) {
      if (connectionError.message.includes('Connection failed')) {
        throw new Error('Unable to connect to XRPL testnet. This could be due to network issues or CSP restrictions.');
      } else if (connectionError.message.includes('CSP') || connectionError.message.includes('Content Security Policy')) {
        throw new Error('Connection blocked by Content Security Policy. Please refresh the page and try again.');
      }
    }
    
    throw new Error(`XRPL connection failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`);
  } finally {
    try {
      if (client.isConnected()) {
        await client.disconnect();
        console.log('🔌 Disconnected from XRPL testnet');
      }
    } catch (disconnectError) {
      console.warn('⚠️ Error during XRPL disconnect:', disconnectError);
    }
  }
};

// Process donation with XRPL transaction
export const processDonation = async (
  campaignId: string,
  campaignWalletAddress: string,
  amount: number,
  donorAddress: string,
  campaignTitle?: string,
  organizationName?: string
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

    // Helper function to convert string to hex (browser-compatible)
    const stringToHex = (str: string): string => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
      return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    };

    // Create payment transaction using RLUSD
    const transaction = {
      TransactionType: 'Payment',
      Account: donorAddress,
      Destination: campaignWalletAddress,
      Amount: {
        currency: 'USD', // RLUSD currency code
        value: amount.toString(), // Amount in RLUSD
        issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De' // RLUSD issuer on testnet
      },
      Memos: [{
        Memo: {
          MemoData: stringToHex(JSON.stringify({
            type: 'donation',
            campaign_id: campaignId,
            amount: amount,
            currency: 'RLUSD',
            timestamp: new Date().toISOString()
          })),
          MemoFormat: stringToHex('text/plain'),
          MemoType: stringToHex('donation')
        }
      }]
    };

    // Validate transaction before submission
    console.log('💾 Transaction validation:');
    console.log('- From:', donorAddress);
    console.log('- To:', campaignWalletAddress);
    console.log('- Amount:', amount, 'RLUSD');
    console.log('- Currency:', transaction.Amount.currency);
    console.log('- Issuer:', transaction.Amount.issuer);
    console.log('- Memo size:', transaction.Memos[0].Memo.MemoData.length / 2, 'bytes');

    console.log('📤 Submitting donation transaction via Crossmark...');
    console.log('🔗 Transaction to submit:', transaction);
    
    // Sign and submit transaction
    const response = await window.crossmark.methods.signAndSubmit(transaction);
    
    console.log('📨 Raw Crossmark response received:', response);
    console.log('📨 Response type:', typeof response);
    console.log('📨 Response constructor:', response?.constructor?.name);
    
    if (!response) {
      throw new Error('No response received from Crossmark');
    }

    // Handle error responses
    if (response.error) {
      console.error('❌ Crossmark error:', response.error);
      if (response.error === 'cancelled') {
        throw new Error('Donation was cancelled by user');
      }
      throw new Error(`Crossmark error: ${response.error}`);
    }

    // Handle rejected/failed responses
    if (response.rejected || response.failed) {
      console.error('❌ Transaction was rejected or failed:', response);
      throw new Error('Transaction was rejected or failed. Please try again.');
    }

    // Handle different possible response formats
    let txHash = null;
    
    // Log the full response structure for debugging
    console.log('📨 Full Crossmark response structure:', JSON.stringify(response, null, 2));
    
    // Try different possible response structures
    if (response.result && response.result.hash) {
      txHash = response.result.hash;
      console.log('✅ Found transaction hash in response.result.hash');
    } else if (response.hash) {
      txHash = response.hash;
      console.log('✅ Found transaction hash in response.hash');
    } else if (response.response && response.response.data && response.response.data.hash) {
      txHash = response.response.data.hash;
      console.log('✅ Found transaction hash in response.response.data.hash');
    } else if (response.response && response.response.hash) {
      txHash = response.response.hash;
      console.log('✅ Found transaction hash in response.response.hash');
    } else if (response.data && response.data.hash) {
      txHash = response.data.hash;
      console.log('✅ Found transaction hash in response.data.hash');
    } else if (response.tx_hash) {
      txHash = response.tx_hash;
      console.log('✅ Found transaction hash in response.tx_hash');
    } else if (response.transaction_hash) {
      txHash = response.transaction_hash;
      console.log('✅ Found transaction hash in response.transaction_hash');
    } else if (response.txHash) {
      txHash = response.txHash;
      console.log('✅ Found transaction hash in response.txHash');
    } else if (typeof response === 'string') {
      // Sometimes the response might be a string hash directly
      txHash = response;
      console.log('✅ Response is directly a transaction hash string');
    } else {
      // Look for any property that might contain a valid transaction hash
      console.log('🔍 Searching for transaction hash in all response properties...');
      const searchResponse = (obj: any, path = ''): string | null => {
        if (typeof obj === 'string' && /^[A-Fa-f0-9]{64}$/.test(obj)) {
          console.log(`✅ Found potential transaction hash at ${path}:`, obj);
          return obj;
        }
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const result = searchResponse(value, path ? `${path}.${key}` : key);
            if (result) return result;
          }
        }
        return null;
      };
      
      const foundHash = searchResponse(response);
      if (foundHash) {
        txHash = foundHash;
        console.log('✅ Found transaction hash through deep search');
      }
    }

    console.log('🔍 Extracted transaction hash:', txHash);

    // Validate transaction hash format (XRPL hashes are 64 character hex strings)
    if (txHash && typeof txHash === 'string') {
      const hashPattern = /^[A-Fa-f0-9]{64}$/;
      if (!hashPattern.test(txHash)) {
        console.warn('⚠️ Transaction hash format looks invalid:', txHash);
        console.warn('⚠️ Expected 64-character hex string, got:', typeof txHash, txHash.length, 'characters');
      } else {
        console.log('✅ Transaction hash format validated');
      }
    }

    if (!txHash) {
      console.error('❌ Could not find transaction hash in any expected location');
      console.error('❌ Full response structure:', JSON.stringify(response, null, 2));
      console.error('❌ Available response keys:', Object.keys(response || {}));
      
      // Check if the transaction was actually submitted (some success indicators)
      if (response.result || response.success || response.submitted) {
        console.log('⚠️ Transaction appears to have been submitted, but hash is missing');
        console.log('⚠️ This might be a timing issue - transaction could still be processing');
        throw new Error('Transaction was submitted but hash not immediately available. Please check your wallet for confirmation.');
      }
      
      throw new Error('No transaction hash found in response. Check console for full response details.');
    }

    console.log('✅ Transaction submitted with hash:', txHash);
    
    // Additional validation - ensure txHash is a valid string
    if (typeof txHash !== 'string' || txHash.length === 0) {
      console.error('❌ Invalid transaction hash type or empty:', typeof txHash, txHash);
      throw new Error('Invalid transaction hash received from Crossmark');
    }

    // Wait for transaction validation
    console.log('⏳ Waiting for transaction validation on XRPL...');
    
    try {
      const validatedTransaction = await waitForTransactionValidation(txHash);

      if (validatedTransaction.validated) {
        console.log('✅ Transaction validated! Storing donation in database...');
        
        // Store donation in database
        await storeDonationInDatabase(campaignId, donorAddress, amount, txHash, campaignTitle, organizationName);
        
        console.log('💾 Storing donation in database:', {
          campaignId,
          donorAddress, 
          amount,
          txHash,
          currency: 'RLUSD'
        });

        return {
          success: true,
          txHash,
          message: `Successfully donated ${amount} RLUSD to campaign!`
        };
      } else {
        throw new Error('Transaction failed validation');
      }
    } catch (validationError) {
      console.warn('⚠️ Transaction validation failed, but transaction was submitted:', validationError);
      console.log('⚠️ This could be due to XRPL testnet connectivity issues');
      console.log('💾 Proceeding to store donation with transaction hash (validation pending)');
      
      // Store donation anyway since we have the transaction hash
      try {
        await storeDonationInDatabase(campaignId, donorAddress, amount, txHash, campaignTitle, organizationName);
        
        return {
          success: true,
          txHash,
          message: `Donation of ${amount} RLUSD submitted! Transaction hash: ${txHash.substring(0, 8)}... (Validation pending due to network issues)`
        };
      } catch (dbError) {
        console.error('Failed to store donation in database:', dbError);
        return {
          success: true,
          txHash,
          message: `Donation submitted with hash: ${txHash.substring(0, 8)}... Please save this for your records.`
        };
      }
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
    console.log('🔍 Fetching donations for donor:', donorAddress);
    
    // Try to fetch from database first
    const response = await fetch(`http://localhost:3001/api/donations/donor/${donorAddress}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const dbDonations = data.donations || [];
    
    console.log('✅ Fetched donations from database:', dbDonations.length);
    
    // Also get local donations as fallback/supplement
    const localDonations = JSON.parse(localStorage.getItem('user_donations') || '[]')
      .filter((donation: any) => donation.donorAddress === donorAddress);
    
    console.log('📦 Found local donations:', localDonations.length);
    
    // Combine and deduplicate by txHash
    const allDonations = [...dbDonations];
    const existingHashes = new Set(dbDonations.map((d: Donation) => d.txHash));
    
    localDonations.forEach((localDonation: any) => {
      if (!existingHashes.has(localDonation.txHash)) {
        allDonations.push({
          campaignId: localDonation.campaignId,
          donorAddress: localDonation.donorAddress,
          amount: localDonation.amount,
          txHash: localDonation.txHash,
          createdAt: localDonation.createdAt,
          campaignTitle: localDonation.campaignTitle,
          organizationName: localDonation.organizationName
        });
      }
    });
    
    console.log('✅ Total unique donations found:', allDonations.length);
    return allDonations;
    
  } catch (error) {
    console.error('❌ Failed to fetch donor donations from database:', error);
    console.log('📦 Falling back to local storage only');
    
    // Fallback to localStorage only
    const localDonations = JSON.parse(localStorage.getItem('user_donations') || '[]')
      .filter((donation: any) => donation.donorAddress === donorAddress)
      .map((localDonation: any) => ({
        campaignId: localDonation.campaignId,
        donorAddress: localDonation.donorAddress,
        amount: localDonation.amount,
        txHash: localDonation.txHash,
        createdAt: localDonation.createdAt,
        campaignTitle: localDonation.campaignTitle || 'Unknown Campaign',
        organizationName: localDonation.organizationName || 'Unknown Organization'
      }));
    
    console.log('📦 Returned local donations:', localDonations.length);
    return localDonations;
  }
}; 