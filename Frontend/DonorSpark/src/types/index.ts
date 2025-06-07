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
export interface CrossmarkTransaction {
  TransactionType: string;
  Account: string;
  Fee: string;
  Flags: number;
  // For Payment
  Destination?: string;
  Amount?: string;
  Memos?: any[];
  // For DocumentSet (legacy, not used)
  DocumentNumber?: number;
  Data?: string;
}

export interface CrossmarkResponse {
  response: {
    result: {
      meta: {
        TransactionResult: string;
      };
      hash: string;
    };
  };
}

export interface Crossmark {
  methods: {
    signAndSubmit(transaction: CrossmarkTransaction): Promise<CrossmarkResponse>;
    signInAndWait(): Promise<{ address: string }>;
  };
}

declare global {
  interface Window {
    crossmark: Crossmark;
  }
} 