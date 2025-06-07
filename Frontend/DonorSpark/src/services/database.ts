import mysql from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // Replace with your MySQL password
  database: 'donorspark'
});

export interface CampaignTransaction {
  campaign_id: string;
  tx_hash: string;
}

export const storeCampaignTransaction = async (campaignId: string, txHash: string): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'INSERT INTO campaign_transactions (campaign_id, tx_hash) VALUES (?, ?)',
        [campaignId, txHash]
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error storing campaign transaction:', error);
    throw error;
  }
};

export const getCampaignTransactions = async (campaignId: string): Promise<CampaignTransaction[]> => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT campaign_id, tx_hash FROM campaign_transactions WHERE campaign_id = ?',
        [campaignId]
      );
      return rows as CampaignTransaction[];
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting campaign transactions:', error);
    throw error;
  }
}; 