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

export const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'status' | 'currentAmount'>): Promise<Campaign> => {
  const user = localStorage.getItem('donorspark_user');
  if (!user) {
    throw new Error('User must be logged in to create a campaign');
  }

  const { address, type } = JSON.parse(user);
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
    const metadata: CampaignMetadata = {
      id: campaign.id,
      organizationAddress: address,
      title: campaign.title,
      description: campaign.description,
      targetAmount: campaign.targetAmount,
      currentAmount: campaign.currentAmount,
      endDate: campaign.endDate,
      category: campaign.category,
      status: campaign.status
    };

    // Convert metadata to hex string (max 256 bytes as per XLS-48d)
    const metadataHex = Buffer.from(JSON.stringify(metadata)).toString('hex');
    
    // Create DocumentSet transaction
    const response = await window.crossmark.methods.signAndSubmit({
      TransactionType: 'DocumentSet',
      DocumentNumber: CAMPAIGN_DOCUMENT_NUMBER,
      Data: metadataHex
    });

    if (response.response.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error('Failed to store campaign metadata on-chain');
    }

    // Store campaign in local storage
    const campaigns = await getCampaigns();
    campaigns.push(campaign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));

    return campaign;
  } catch (error) {
    console.error('Error storing campaign metadata:', error);
    throw new Error('Failed to create campaign');
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