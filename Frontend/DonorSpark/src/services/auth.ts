// Import the Crossmark SDK
import sdk from '@crossmarkio/sdk';
import { User, Donor, Organization } from '../types';

// Whitelist of addresses that are allowed to be organizations
const ORGANIZATION_WHITELIST = [
  'rLt7p9bm8pkKoUAYDksD8RG1R7PxbzMC6z', // Organization wallet
  'rUeUuomy1NfZqX5o9xexEhzd9vgb1qCkJD', // Additional organization wallet
  // Add more whitelisted addresses here
];

// Get user type from address
const getUserType = (address: string): 'donor' | 'organization' => {
  // Check if the address is in the whitelist
  if (ORGANIZATION_WHITELIST.includes(address)) {
    return 'organization';
  }
  return 'donor';
};

// Create a donor user
const createDonor = (address: string): Donor => ({
  id: address,
  email: `${address}@xrpl.org`,
  name: 'Donor',
  type: 'donor',
  createdAt: new Date().toISOString(),
  totalDonations: 0,
  campaignsSupported: [],
  walletAddress: address,
});

// Create an organization user
const createOrganization = (address: string): Organization => ({
  id: address,
  email: `${address}@xrpl.org`,
  name: 'Charity Organization',
  type: 'organization',
  createdAt: new Date().toISOString(),
  description: 'A charitable organization making a difference',
  campaignsCreated: [],
  totalRaised: 0,
  walletAddress: address,
  verified: ORGANIZATION_WHITELIST.includes(address), // Automatically verify whitelisted organizations
});

// Sign in with Crossmark
export const signInWithCrossmark = async (): Promise<User | null> => {
  try {
    // Check if Crossmark is available
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    // Wait for Crossmark to be injected (up to 5 seconds)
    let attempts = 0;
    while (!window.crossmark && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.crossmark) {
      // Open Crossmark website in a new tab
      window.open('https://crossmark.io', '_blank');
      throw new Error('Please install Crossmark from crossmark.io and refresh the page');
    }

    // Try to sign in using the SDK
    const signInResult = await sdk.methods.signInAndWait();
    if (!signInResult?.response?.data?.address) {
      throw new Error('Failed to get address from Crossmark. Please try again.');
    }

    const address = signInResult.response.data.address;
    const userType = getUserType(address);

    // Create the appropriate user type
    const user = userType === 'organization' 
      ? createOrganization(address)
      : createDonor(address);

    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Crossmark sign in failed:', error);
    // Only throw the error message, not the full error object
    throw new Error(error instanceof Error ? error.message : 'Failed to connect to Crossmark');
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  localStorage.removeItem('user');
};

// Get current user
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem('user');
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};

// Check if user is an organization
export const isOrganization = (): boolean => {
  const user = getCurrentUser();
  return user?.type === 'organization';
};

// Check if user is a donor
export const isDonor = (): boolean => {
  const user = getCurrentUser();
  return user?.type === 'donor';
};

// Check if address is whitelisted
export const isWhitelisted = (address: string): boolean => {
  return ORGANIZATION_WHITELIST.includes(address);
};

// Update user type (for testing purposes)
export const updateUserType = async (address: string, type: 'donor' | 'organization'): Promise<void> => {
  const user = getCurrentUser();
  if (user && user.id === address) {
    user.type = type;
    localStorage.setItem('user', JSON.stringify(user));
  }
}; 