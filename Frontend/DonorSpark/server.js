import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create MySQL connection pool (without specifying database initially)
const initialPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Main pool with database
let pool;

// Initialize database and tables
async function initializeDatabase() {
  try {
    // First, create the database if it doesn't exist
    const connection = await initialPool.getConnection();
    
    try {
      await connection.execute('CREATE DATABASE IF NOT EXISTS donorspark');
      console.log('Database "donorspark" created or already exists');
    } finally {
      connection.release();
    }
    
    // Now create the main pool with the database
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'donorspark',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Create tables
    const dbConnection = await pool.getConnection();
    try {
      // Create campaign_transactions table if it doesn't exist
      await dbConnection.execute(`
        CREATE TABLE IF NOT EXISTS campaign_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          campaign_id VARCHAR(255) NOT NULL,
          tx_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_campaign_id (campaign_id)
        )
      `);
      
      console.log('Database tables initialized');
    } finally {
      dbConnection.release();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Routes
app.post('/api/campaigns/transactions', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const { campaignId, txHash } = req.body;
    
    if (!campaignId || !txHash) {
      return res.status(400).json({ error: 'Campaign ID and transaction hash are required' });
    }
    
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'INSERT INTO campaign_transactions (campaign_id, tx_hash) VALUES (?, ?)',
        [campaignId, txHash]
      );
      
      res.json({ success: true, message: 'Transaction stored successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error storing transaction:', error);
    res.status(500).json({ error: 'Failed to store transaction' });
  }
});

app.get('/api/campaigns/:campaignId/transactions', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const { campaignId } = req.params;
    
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT campaign_id, tx_hash, created_at FROM campaign_transactions WHERE campaign_id = ?',
        [campaignId]
      );
      
      res.json({ transactions: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DonorSpark API is running' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`DonorSpark API server running on port ${PORT}`);
  await initializeDatabase();
});

export default app; 