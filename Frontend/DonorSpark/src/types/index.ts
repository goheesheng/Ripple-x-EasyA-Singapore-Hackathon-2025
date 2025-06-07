export interface User {
  id: string;
  email: string;
  name: string;
  type: 'donor' | 'organization';
  description?: string;
  createdAt: string;
  walletAddress: string;
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
  organizationDescription?: string;
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
  status: 'pending' | 'completed' | 'failed';
}

// Crossmark types
declare global {
  interface Window {
    crossmark: {
      methods: {
        signInAndWait: () => Promise<{
          response: {
            data: {
              address: string;
            };
          };
        }>;
        signAndSubmit: (tx: {
          TransactionType: string;
          DocumentNumber: number;
          Data: string;
        }) => Promise<{
          response: {
            result: {
              meta: {
                TransactionResult: string;
              };
            };
          };
        }>;
      };
    };
  }
} 