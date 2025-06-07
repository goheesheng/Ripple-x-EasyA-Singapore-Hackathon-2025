const API_BASE_URL = 'http://localhost:5000/api';

export const storeUser = async (account: string, isOrg: boolean) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account, isOrg }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error storing user:', error);
    throw error;
  }
};