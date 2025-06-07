// import sdk from '@crossmarkio/sdk';
import { User, Donor, Organization } from '../types';

// Use window.crossmark instead
const sdk = (window as any).crossmark;

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
});

// Sign in with Crossmark
export const signInWithCrossmark = async (): Promise<User | null> => {
  try {
    // Check if Crossmark is available
    if (!sdk) {
      window.open('https://crossmark.io', '_blank');
      throw new Error('Crossmark is not installed. Please install it from crossmark.io');
    }

    // Try to sign in
    const { response } = await sdk.methods.signInAndWait();
    if (!response?.data?.address) {
      throw new Error('Failed to get address from Crossmark');
    }
    const address = response.data.address;
    const userType = getUserType(address);

    // Create the appropriate user type
    const user = userType === 'organization' 
      ? createOrganization(address)
      : createDonor(address);

    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Crossmark sign in failed:', error);
    return null;
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