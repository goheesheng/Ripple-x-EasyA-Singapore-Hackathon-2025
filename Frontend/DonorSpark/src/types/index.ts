export interface User {
  id: string;
  email: string;
  name: string;
  type: 'donor' | 'organization';
  createdAt: string;
}

export interface Donor extends User {
  type: 'donor';
  walletAddress?: string;
  donations: string[]; // Array of campaign IDs
}

export interface Organization extends User {
  type: 'organization';
  website?: string;
  description: string;
  campaigns: string[]; // Array of campaign IDs
  verified: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string;
  category: string;
  organizationId: string;
  organizationName: string;
  image?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  donorId: string;
  amount: number;
  message?: string;
  createdAt: string;
} 