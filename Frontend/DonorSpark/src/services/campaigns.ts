import { getCurrentUser } from './auth';
import { Campaign } from '../types';

const STORAGE_KEY = 'donorspark_campaigns';

// Document number for campaign metadata (using a number > 65535 as per XLS-48d)
const CAMPAIGN_DOCUMENT_NUMBER = 100000;

interface CampaignMetadata {
  id: string;
  organizationAddress: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string;
  category: string;
  status: 'active' | 'completed' | 'cancelled';
}

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

export const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'status' | 'currentAmount'>): Promise<Campaign> => {
  const user = localStorage.getItem('user');
  if (!user) {
    throw new Error('User must be logged in to create a campaign');
  }

  const { id: address, type } = JSON.parse(user);
  if (type !== 'organization') {
    throw new Error('Only organizations can create campaigns');
  }

  const campaign: Campaign = {
    ...campaignData,
    id: Math.random().toString(36).substring(7),
    createdAt: new Date().toISOString(),
    status: 'active',
    currentAmount: 0,
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
      Destination: 'rDUwA8yoYYE2cnBkPEh2qDcRvLx8hybLh1', // Specified destination wallet
      Amount: '1', // Minimum amount for memo transaction
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

    // Store campaign in local storage
    const campaigns = await getCampaigns();
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

export const getCampaignsByDonor = async (donorId: string): Promise<Campaign[]> => {
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