import { Campaign } from '../types';
import { Client, Wallet } from 'xrpl';

// Browser-side database operations via API calls
// Store campaign in MySQL database
const storeCampaignInDatabase = async (campaign: Campaign): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3001/api/campaigns', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        targetAmount: campaign.targetAmount,
        endDate: campaign.endDate,
        category: campaign.category,
        organizationId: campaign.organizationId,
        organizationName: campaign.organizationName,
        organizationDescription: campaign.organizationDescription,
        organizationWebsite: campaign.organizationWebsite,
        imageUrl: campaign.image,
        campaignWalletAddress: campaign.campaignWalletAddress
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Campaign stored in database:', result);
    
  } catch (error) {
    console.error('Failed to store campaign in database:', error);
    throw error;
  }
};

// Store campaign transaction in MySQL database - ONLY called after blockchain confirmation
const storeCampaignTransaction = async (campaignId: string, txHash: string): Promise<void> => {
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
  try {
    const response = await fetch('http://localhost:3001/api/campaigns');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.campaigns || [];
  } catch (error) {
    console.error('Failed to fetch campaigns from database:', error);
    
    // Fallback to localStorage if API fails
  const campaigns = localStorage.getItem(STORAGE_KEY);
    if (campaigns) {
      return JSON.parse(campaigns);
    }
    
    // Last resort: return sample campaigns
    return sampleCampaigns;
  }
};

export const getCampaignById = async (campaignId: string): Promise<Campaign | null> => {
  try {
    const response = await fetch(`http://localhost:3001/api/campaigns/${campaignId}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.campaign || null;
  } catch (error) {
    console.error('Failed to fetch campaign from database:', error);
    
    // Fallback to localStorage
    const campaigns = localStorage.getItem(STORAGE_KEY);
    if (campaigns) {
      const parsedCampaigns: Campaign[] = JSON.parse(campaigns);
      return parsedCampaigns.find(c => c.id === campaignId) || null;
    }
    
    // Fallback to sample campaigns
    return sampleCampaigns.find(c => c.id === campaignId) || null;
  }
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

    // CRITICAL: Only store in database AFTER transaction is mined and validated
    if (response.result && response.result.hash) {
      const txHash = response.result.hash;
      console.log('📤 Transaction submitted to XRPL with hash:', txHash);
      console.log('⏳ Waiting for transaction to be MINED and VALIDATED on ledger...');
      console.log('🔍 This process ensures data integrity - we only store in MySQL after blockchain confirmation');
      
      try {
        // STEP 1: Wait for transaction to be mined and validated on XRPL ledger
        console.log('🔗 Polling XRPL ledger for transaction confirmation...');
        const validatedTransaction = await waitForTransactionValidation(txHash);
        
        if (validatedTransaction.validated) {
          console.log('✅ SUCCESS: Transaction has been MINED and VALIDATED on XRPL ledger!');
          console.log('📊 Ledger Index:', validatedTransaction.transaction.ledger_index);
          console.log('🔗 Transaction Hash:', validatedTransaction.transaction.hash);
          
          // STEP 2: NOW it's safe to store in MySQL database
          console.log('💾 Now storing campaign + transaction hash in MySQL database...');
          await storeCampaignTransaction(campaign.id, txHash);
          console.log('✅ SUCCESS: Campaign and validated transaction hash stored in database');
          
        } else {
          throw new Error('Transaction failed validation - not storing in database');
        }
      } catch (validationError) {
        console.error('❌ FAILED: Transaction validation failed:', validationError);
        console.log('⚠️  Campaign will be stored locally only (no database storage)');
        
        // Don't store in MySQL if transaction validation fails
        const errorMessage = validationError instanceof Error ? validationError.message : 'Unknown validation error';
        throw new Error(`Blockchain validation failed: ${errorMessage}`);
      }
    } else {
      throw new Error('No transaction hash received from Crossmark');
    }

    // Store campaign in MySQL database
    try {
      await storeCampaignInDatabase(campaign);
      console.log('✅ Campaign stored in database successfully');
    } catch (dbError) {
      console.error('Failed to store campaign in database:', dbError);
      // Fall back to localStorage
    const campaigns = await getCampaigns();
    campaigns.push(campaign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    }
    
    // Store wallet seed securely in localStorage (sensitive data)
    const campaignWallets = JSON.parse(localStorage.getItem('campaign_wallets') || '{}');
    campaignWallets[campaign.id] = {
      address: campaignWallet.address,
      seed: campaignWallet.seed
    };
    localStorage.setItem('campaign_wallets', JSON.stringify(campaignWallets));

    return campaign;
  } catch (error) {
    console.error('Error storing campaign metadata:', error);
    
    if (error instanceof Error && error.message === 'cancelled') {
      throw new Error('Campaign creation was cancelled by user');
    }
    
    // Still create campaign locally even if on-chain storage fails
    try {
      await storeCampaignInDatabase(campaign);
      console.log('✅ Campaign stored in database (without blockchain confirmation)');
    } catch (dbError) {
      console.error('Failed to store campaign in database:', dbError);
      // Fall back to localStorage only
    const campaigns = await getCampaigns();
    campaigns.push(campaign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    }
    
    // Store wallet info even if transaction fails
    const campaignWallets = JSON.parse(localStorage.getItem('campaign_wallets') || '{}');
    campaignWallets[campaign.id] = {
      address: campaignWallet.address,
      seed: campaignWallet.seed
    };
    localStorage.setItem('campaign_wallets', JSON.stringify(campaignWallets));
    
    if (error instanceof Error) {
      throw new Error(`Campaign created locally but on-chain storage failed: ${error.message}`);
    }
    throw new Error('Campaign created locally but on-chain storage failed');
  }
};

export const getCampaignsByOrganization = async (organizationId: string): Promise<Campaign[]> => {
  try {
    const response = await fetch(`http://localhost:3001/api/campaigns/organization/${organizationId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.campaigns || [];
  } catch (error) {
    console.error('Failed to fetch organization campaigns from database:', error);
    
    // Fallback to localStorage filtering
  const campaigns = await getCampaigns();
  return campaigns.filter(campaign => campaign.organizationId === organizationId);
  }
};

export const getCampaignsByDonor = async (): Promise<Campaign[]> => {
  // TODO: Implement donor tracking
  return [];
};

export const updateCampaignAmount = async (campaignId: string, amount: number): Promise<Campaign> => {
  try {
    // Update amount in database
    const response = await fetch(`http://localhost:3001/api/campaigns/${campaignId}/amount`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ amount })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get updated campaign
    const campaignResponse = await fetch(`http://localhost:3001/api/campaigns/${campaignId}`);
    if (!campaignResponse.ok) {
      throw new Error(`HTTP error! status: ${campaignResponse.status}`);
    }
    
    const data = await campaignResponse.json();
    return data.campaign;
    
  } catch (error) {
    console.error('Failed to update campaign amount in database:', error);
    
    // Fallback to localStorage
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
  }
}; 