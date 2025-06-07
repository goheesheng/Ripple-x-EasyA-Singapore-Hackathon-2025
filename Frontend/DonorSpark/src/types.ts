export interface User {
  id: string;
  email: string;
  name: string;
  type: 'donor' | 'organization';
  description?: string;
  createdAt: string;
}

export interface Donor extends User {
  type: 'donor';
  totalDonations: number;
  campaignsSupported: string[]; // Array of campaign IDs
}

export interface Organization extends User {
  type: 'organization';
  description: string;
  campaignsCreated: string[]; // Array of campaign IDs
  totalRaised: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string;
  organizationId: string;
  organizationName: string;
  organizationDescription?: string;
  imageUrl?: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Donation {
  id: string;
  campaignId: string;
  donorId: string;
  amount: number;
  message?: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
} 