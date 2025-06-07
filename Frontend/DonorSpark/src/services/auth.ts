// Import the Crossmark SDK
import sdk from '@crossmarkio/sdk';
import { User, Donor, Organization } from '../types';

// Mock user type mapping (in a real app, this would be stored in a database)
const userTypeMap: Record<string, 'donor' | 'organization'> = {};

// Get user type from address
const getUserType = (address: string): 'donor' | 'organization' => {
  return userTypeMap[address] || 'donor'; // Default to donor if not found
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
  verified: false, // New organizations start as unverified
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
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  return JSON.parse(userStr);
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

// Toggle user type between donor and organization
export const toggleUserType = async (): Promise<void> => {
  const user = getCurrentUser();
  if (!user) return;

  const newType = user.type === 'donor' ? 'organization' : 'donor';
  userTypeMap[user.id] = newType;
  
  // Create a new user object with the appropriate type
  const newUser = newType === 'organization' 
    ? createOrganization(user.id)
    : createDonor(user.id);
    
  localStorage.setItem('user', JSON.stringify(newUser));
};

// Update user type (for testing purposes)
export const updateUserType = async (address: string, type: 'donor' | 'organization'): Promise<void> => {
  userTypeMap[address] = type;
  const user = getCurrentUser();
  if (user && user.id === address) {
    user.type = type;
    localStorage.setItem('user', JSON.stringify(user));
  }
}; 