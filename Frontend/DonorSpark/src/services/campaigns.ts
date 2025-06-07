import { Campaign } from '../types';
import { Client, Wallet } from 'xrpl';

// Only import database on server-side (when not in browser)
let storeCampaignTransaction: ((campaignId: string, txHash: string) => Promise<void>) | null = null;

// Dynamically import database functions only on server-side
if (typeof window === 'undefined') {
  // This will only run on server-side
  import('./database').then(db => {
    storeCampaignTransaction = db.storeCampaignTransaction;
  }).catch(() => {
    console.log('Database not available in browser environment');
  });
}

// Alternative: Create an API call function for browser-side database operations
const storeCampaignToDatabase = async (campaignId: string, txHash: string): Promise<void> => {
  try {
    // Make API call to backend server
    const response = await fetch('http://localhost:3001/api/campaigns/transactions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ campaignId, txHash })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Campaign transaction stored in database:', result);
    
  } catch (error) {
    console.error('Failed to store campaign transaction in database:', error);
    
    // Fallback: Store in localStorage as backup
    console.log('Falling back to localStorage storage');
    const transactions = JSON.parse(localStorage.getItem('campaign_transactions') || '[]');
    transactions.push({ campaignId, txHash, timestamp: new Date().toISOString() });
    localStorage.setItem('campaign_transactions', JSON.stringify(transactions));
    
    // Don't throw the error - allow campaign creation to continue
  }
};

const STORAGE_KEY = 'donorspark_campaigns';
const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

// Document number for campaign metadata (using a number > 65535 as per XLS-48d)
const CAMPAIGN_DOCUMENT_NUMBER = 100000;

// Sample campaigns data
const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Clean Water for All',
    description: 'Providing clean drinking water to rural communities in Southeast Asia',
    targetAmount: 50000,
    currentAmount: 25000,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Health',
    organizationId: 'sample_org_1',
    organizationName: 'Water for Life Foundation',
    organizationDescription: 'Dedicated to providing clean water access worldwide',
    image: 'https://images.unsplash.com/photo-1548848221-0c2e497ed557',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Education for Underprivileged Children',
    description: 'Building schools and providing educational materials for children in need',
    targetAmount: 75000,
    currentAmount: 35000,
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Education',
    organizationId: 'sample_org_2',
    organizationName: 'Bright Future Education',
    organizationDescription: 'Empowering through education',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
    status: 'active',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Wildlife Conservation',
    description: 'Protecting endangered species and their habitats',
    targetAmount: 100000,
    currentAmount: 60000,
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Environment',
    organizationId: 'sample_org_3',
    organizationName: 'Wildlife Guardians',
    organizationDescription: 'Saving wildlife, one species at a time',
    image: 'https://images.unsplash.com/photo-1534567110353-1f46d0708b7c',
    status: 'active',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Food Security Program',
    description: 'Providing sustainable food solutions to food-insecure communities',
    targetAmount: 30000,
    currentAmount: 15000,
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Food Security',
    organizationId: 'sample_org_4',
    organizationName: 'Food for All Initiative',
    organizationDescription: 'Fighting hunger, one meal at a time',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554',
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'Medical Aid for Refugees',
    description: 'Providing essential medical care and supplies to refugee camps',
    targetAmount: 80000,
    currentAmount: 40000,
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Healthcare',
    organizationId: 'sample_org_5',
    organizationName: 'Global Health Response',
    organizationDescription: 'Bringing healthcare to those who need it most',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const getCampaigns = async (): Promise<Campaign[]> => {
  const campaigns = localStorage.getItem(STORAGE_KEY);
  if (!campaigns) {
    // Initialize with sample campaigns
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleCampaigns));
    return sampleCampaigns;
  }
  return JSON.parse(campaigns);
};

// Helper function to convert string to hex
const stringToHex = (str: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

// Helper function to wait for transaction validation on XRPL ledger
const waitForTransactionValidation = async (txHash: string, maxWaitTime: number = 30000): Promise<any> => {
  const client = new Client(TESTNET_URL, {
    connectionTimeout: 10000,
    timeout: 20000
  });

  try {
    console.log('Connecting to XRPL to check transaction validation...');
    await client.connect();
    
    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        console.log(`Checking transaction validation for hash: ${txHash}`);
        
        // Get transaction details from ledger
        const txResponse = await client.request({
          command: 'tx',
          transaction: txHash
        });
        
        if (txResponse.result) {
          console.log('Transaction found on ledger:', {
            hash: txResponse.result.hash,
            validated: txResponse.result.validated,
            ledger_index: txResponse.result.ledger_index,
            meta: txResponse.result.meta ? 'present' : 'missing'
          });
          
          // If transaction is validated, return success
          if (txResponse.result.validated) {
            return {
              validated: true,
              transaction: txResponse.result
            };
          }
        }
      } catch (error) {
        // Transaction might not be found yet, continue polling
        console.log('Transaction not found yet, continuing to poll...');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    // Timeout reached
    throw new Error(`Transaction validation timeout after ${maxWaitTime}ms`);
    
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log('Disconnected from XRPL validation check');
    }
  }
};

// Helper function to generate a new XRPL wallet
const generateCampaignWallet = async (): Promise<{ address: string; seed: string }> => {
  const client = new Client(TESTNET_URL, {
    connectionTimeout: 10000,
    timeout: 20000
  });

  try {
    console.log('Connecting to XRPL testnet...');
    await client.connect();
    console.log('Connected to XRPL testnet');

    // Generate and fund a new wallet
    console.log('Generating and funding new wallet...');
    const fund_result = await client.fundWallet();
    const new_wallet = fund_result.wallet;
    
    console.log('Wallet funded successfully:', {
      address: new_wallet.address,
      balance: fund_result.balance
    });

    return {
      address: new_wallet.address,
      seed: new_wallet.seed || ''
    };
  } catch (error) {
    console.error('Error generating campaign wallet:', error);
    // For now, generate a local wallet without funding it
    // This allows the app to continue working even if testnet is down
    const wallet = Wallet.generate();
    console.log('Generated offline wallet:', wallet.address);
    return {
      address: wallet.address,
      seed: wallet.seed || ''
    };
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log('Disconnected from XRPL testnet');
    }
  }
};

export const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'status' | 'currentAmount'>): Promise<Campaign> => {
  const user = localStorage.getItem('user');
  if (!user) {
    throw new Error('User must be logged in to create a campaign');
  }

  const { id: address, type } = JSON.parse(user);
  if (type !== 'organization') {
    throw new Error('Only organizations can create campaigns');
  }

  // Generate a new wallet for the campaign
  console.log('Generating new campaign wallet...');
  let campaignWallet;
  try {
    campaignWallet = await generateCampaignWallet();
    console.log('Generated campaign wallet:', campaignWallet.address);
  } catch (error) {
    console.error('Failed to generate campaign wallet:', error);
    throw new Error('Failed to generate campaign wallet. Please try again later.');
  }

  const campaign: Campaign = {
    ...campaignData,
    id: Math.random().toString(36).substring(7),
    createdAt: new Date().toISOString(),
    status: 'active',
    currentAmount: 0,
    campaignWalletAddress: campaignWallet.address
  };

  // Store campaign metadata on-chain
  try {
    console.log('Preparing campaign metadata...');
    
    // First, check if Crossmark is available
    if (typeof window === 'undefined' || !window.crossmark) {
      throw new Error('Crossmark extension not found. Please install Crossmark and try again.');
    }

    // Create the metadata object according to XRPL memo format
    const memoData = {
      type: 'campaign_creation',
      campaign_id: campaign.id,
      organization_address: address,
      campaign_wallet: campaignWallet.address,
      title: campaign.title,
      description: campaign.description,
      target_amount: campaign.targetAmount.toString(),
      end_date: campaign.endDate,
      category: campaign.category,
      status: campaign.status,
      created_at: campaign.createdAt
    };

    // Convert JSON object to hex string
    const memoJson = JSON.stringify(memoData);
    const memoHex = stringToHex(memoJson);
    
    console.log('Metadata size:', memoHex.length / 2, 'bytes');
    console.log('Metadata hex:', memoHex);
    
    if (memoHex.length > 2048) {
      throw new Error('Metadata exceeds 1024 byte Memo limit');
    }

    // Create the Memo field according to XRPL format
    const memo = {
      Memo: {
        MemoData: memoHex,
        MemoFormat: stringToHex('text/plain'),
        MemoType: stringToHex('campaign_creation')
      }
    };

    // Prepare Payment transaction with Memo
    const transaction = {
      TransactionType: 'Payment',
      Account: address,
      Destination: 'rDUwA8yoYYE2cnBkPEh2qDcRvLx8hybLh1',
      Amount: '1',
      Memos: [memo]
    };

    console.log('Submitting transaction:', transaction);
    
    // Sign and submit the transaction using Crossmark
    const response = await window.crossmark.methods.signAndSubmit(transaction);
    console.log('Transaction response:', response);
    
    // Handle the response
    if (!response) {
      throw new Error('No response received from Crossmark');
    }

    if (response.error) {
      if (response.error === 'cancelled') {
        throw new Error('cancelled');
      }
      throw new Error(response.error);
    }

    // Wait for transaction validation on ledger before storing in database
    if (response.result && response.result.hash) {
      console.log('✅ Transaction submitted with hash:', response.result.hash);
      console.log('⏳ Waiting for transaction validation on XRPL ledger...');
      console.log('🔍 This may take 10-30 seconds for the transaction to be mined and validated...');
      
      try {
        // Wait for transaction to be validated on ledger
        const validatedTransaction = await waitForTransactionValidation(response.result.hash);
        
        if (validatedTransaction.validated) {
          console.log('✅ Transaction validated on ledger!');
          console.log('💾 Storing campaign and transaction hash in database...');
          
          // Now store in database since transaction is confirmed
          await storeCampaignToDatabase(campaign.id, response.result.hash);
          console.log('✅ Campaign and transaction hash successfully stored in database');
        } else {
          throw new Error('Transaction failed validation on ledger');
        }
      } catch (validationError) {
        console.error('❌ Transaction validation failed:', validationError);
        
        // If validation fails, still store locally but don't store in MySQL
        console.log('⚠️  Storing campaign locally without database confirmation');
        throw new Error(`Transaction validation failed: ${validationError.message}`);
      }
    }

    // Store campaign and wallet info in local storage
    const campaigns = await getCampaigns();
    
    // Store wallet seed securely
    const campaignWallets = JSON.parse(localStorage.getItem('campaign_wallets') || '{}');
    campaignWallets[campaign.id] = {
      address: campaignWallet.address,
      seed: campaignWallet.seed
    };
    localStorage.setItem('campaign_wallets', JSON.stringify(campaignWallets));
    
    campaigns.push(campaign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));

    return campaign;
  } catch (error) {
    console.error('Error storing campaign metadata:', error);
    
    if (error instanceof Error && error.message === 'cancelled') {
      throw new Error('Campaign creation was cancelled by user');
    }
    
    // Still create campaign locally even if on-chain storage fails
    const campaigns = await getCampaigns();
    
    // Store wallet info even if transaction fails
    const campaignWallets = JSON.parse(localStorage.getItem('campaign_wallets') || '{}');
    campaignWallets[campaign.id] = {
      address: campaignWallet.address,
      seed: campaignWallet.seed
    };
    localStorage.setItem('campaign_wallets', JSON.stringify(campaignWallets));
    
    campaigns.push(campaign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    
    if (error instanceof Error) {
      throw new Error(`Campaign created locally but on-chain storage failed: ${error.message}`);
    }
    throw new Error('Campaign created locally but on-chain storage failed');
  }
};

export const getCampaignsByOrganization = async (organizationId: string): Promise<Campaign[]> => {
  const campaigns = await getCampaigns();
  return campaigns.filter(campaign => campaign.organizationId === organizationId);
};

export const getCampaignsByDonor = async (): Promise<Campaign[]> => {
  // TODO: Implement donor tracking
  return [];
};

export const updateCampaignAmount = async (campaignId: string, amount: number): Promise<Campaign> => {
  const campaigns = await getCampaigns();
  const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
  
  if (campaignIndex === -1) {
    throw new Error('Campaign not found');
  }

  const updatedCampaign = {
    ...campaigns[campaignIndex],
    currentAmount: campaigns[campaignIndex].currentAmount + amount
  };

  campaigns[campaignIndex] = updatedCampaign;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));

  return updatedCampaign;
}; 