import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - ULTRA PERMISSIVE CORS (development only)
app.use((req, res, next) => {
  // Allow ALL origins and methods
  const origin = req.get('Origin');
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD,CONNECT,TRACE');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Access-Control-Expose-Headers', '*');
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${origin || 'unknown origin'}`);
  next();
});

// Additional CORS middleware with ultra-permissive settings
app.use(cors({
  origin: function (origin, callback) {
    // Allow absolutely any origin
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'CONNECT', 'TRACE'],
  allowedHeaders: function (req, callback) {
    // Allow any headers
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
      // Create campaigns table
      await dbConnection.execute(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT NOT NULL,
          target_amount DECIMAL(15,2) NOT NULL,
          current_amount DECIMAL(15,2) DEFAULT 0,
          end_date DATETIME NOT NULL,
          category VARCHAR(100) NOT NULL,
          organization_id VARCHAR(255) NOT NULL,
          organization_name VARCHAR(300) NOT NULL,
          organization_description TEXT,
          organization_website VARCHAR(500),
          image_url TEXT,
          status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
          campaign_wallet_address VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_organization_id (organization_id),
          INDEX idx_status (status),
          INDEX idx_category (category)
        )
      `);
      
      // Create campaign_transactions table if it doesn't exist
      await dbConnection.execute(`
        CREATE TABLE IF NOT EXISTS campaign_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          campaign_id VARCHAR(255) NOT NULL,
          tx_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_campaign_id (campaign_id),
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
        )
      `);

      // Create donations table for tracking individual donations
      await dbConnection.execute(`
        CREATE TABLE IF NOT EXISTS donations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          campaign_id VARCHAR(255) NOT NULL,
          donor_address VARCHAR(255) NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          tx_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_campaign_id (campaign_id),
          INDEX idx_donor_address (donor_address),
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
        )
      `);
      
      console.log('Database tables initialized (campaigns, campaign_transactions, donations)');
    } finally {
      dbConnection.release();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Routes

// Create a new campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    console.log('🔍 Campaign creation request received:');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const {
      id,
      title,
      description,
      targetAmount,
      endDate,
      category,
      organizationId,
      organizationName,
      organizationDescription,
      organizationWebsite,
      imageUrl,
      campaignWalletAddress
    } = req.body;
    
    console.log('📋 Extracted fields:');
    console.log('- id:', id);
    console.log('- title:', title);
    console.log('- description:', description);
    console.log('- targetAmount:', targetAmount);
    console.log('- endDate:', endDate);
    console.log('- category:', category);
    console.log('- organizationId:', organizationId);
    console.log('- organizationName:', organizationName);
    
    if (!id || !title || !description || !targetAmount || !endDate || !category || !organizationId || !organizationName) {
      console.log('❌ Missing required fields validation failed');
      return res.status(400).json({ 
        error: 'Missing required campaign fields',
        received: { id, title, description, targetAmount, endDate, category, organizationId, organizationName }
      });
    }
    
    console.log('📤 Attempting database insert...');
    
    // Convert ISO datetime to MySQL format
    const mysqlEndDate = new Date(endDate).toISOString().slice(0, 19).replace('T', ' ');
    console.log('🕒 Converted endDate from:', endDate, 'to:', mysqlEndDate);
    
    const connection = await pool.getConnection();
    try {
      const insertValues = [
        id, title, description, targetAmount, mysqlEndDate, category,
        organizationId, organizationName, organizationDescription || null,
        organizationWebsite || null, imageUrl || null, campaignWalletAddress || null
      ];
      
      console.log('📝 Insert values:', insertValues);
      
      await connection.execute(`
        INSERT INTO campaigns (
          id, title, description, target_amount, end_date, category,
          organization_id, organization_name, organization_description,
          organization_website, image_url, campaign_wallet_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, insertValues);
      
      console.log('✅ Campaign inserted successfully');
      res.json({ success: true, message: 'Campaign created successfully', campaignId: id });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error creating campaign:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    res.status(500).json({ 
      error: 'Failed to create campaign',
      details: error.message,
      code: error.code
    });
  }
});

// Get all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          id, title, description, target_amount as targetAmount, 
          current_amount as currentAmount, 
          DATE_FORMAT(end_date, '%Y-%m-%dT%H:%i:%s.000Z') as endDate, 
          category, organization_id as organizationId, 
          organization_name as organizationName,
          organization_description as organizationDescription,
          organization_website as organizationWebsite,
          image_url as image, status, campaign_wallet_address as campaignWalletAddress,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') as createdAt, 
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') as updatedAt
        FROM campaigns 
        ORDER BY created_at DESC
      `);
      
      res.json({ campaigns: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get campaigns by organization
app.get('/api/campaigns/organization/:organizationId', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const { organizationId } = req.params;
    
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          id, title, description, target_amount as targetAmount, 
          current_amount as currentAmount, 
          DATE_FORMAT(end_date, '%Y-%m-%dT%H:%i:%s.000Z') as endDate, 
          category, organization_id as organizationId, 
          organization_name as organizationName,
          organization_description as organizationDescription,
          organization_website as organizationWebsite,
          image_url as image, status, campaign_wallet_address as campaignWalletAddress,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') as createdAt, 
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') as updatedAt
        FROM campaigns 
        WHERE organization_id = ?
        ORDER BY created_at DESC
      `, [organizationId]);
      
      res.json({ campaigns: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching organization campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch organization campaigns' });
  }
});

// Get single campaign by ID
app.get('/api/campaigns/:campaignId', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const { campaignId } = req.params;
    
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          id, title, description, target_amount as targetAmount, 
          current_amount as currentAmount, 
          DATE_FORMAT(end_date, '%Y-%m-%dT%H:%i:%s.000Z') as endDate, 
          category, organization_id as organizationId, 
          organization_name as organizationName,
          organization_description as organizationDescription,
          organization_website as organizationWebsite,
          image_url as image, status, campaign_wallet_address as campaignWalletAddress,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') as createdAt, 
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') as updatedAt
        FROM campaigns 
        WHERE id = ?
      `, [campaignId]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      res.json({ campaign: rows[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Update campaign amount (when donations are received)
app.patch('/api/campaigns/:campaignId/amount', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const { campaignId } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    const connection = await pool.getConnection();
    try {
      await connection.execute(`
        UPDATE campaigns 
        SET current_amount = current_amount + ?
        WHERE id = ?
      `, [amount, campaignId]);
      
      res.json({ success: true, message: 'Campaign amount updated successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating campaign amount:', error);
    res.status(500).json({ error: 'Failed to update campaign amount' });
  }
});

// Store a donation
app.post('/api/donations', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const { campaignId, donorAddress, amount, txHash } = req.body;
    
    if (!campaignId || !donorAddress || !amount || !txHash) {
      return res.status(400).json({ error: 'Campaign ID, donor address, amount, and transaction hash are required' });
    }
    
    const connection = await pool.getConnection();
    try {
      // Insert donation record
      await connection.execute(
        'INSERT INTO donations (campaign_id, donor_address, amount, tx_hash) VALUES (?, ?, ?, ?)',
        [campaignId, donorAddress, amount, txHash]
      );
      
      console.log('✅ Donation recorded:', { campaignId, donorAddress, amount, txHash });
      res.json({ success: true, message: 'Donation recorded successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error storing donation:', error);
    res.status(500).json({ error: 'Failed to store donation' });
  }
});

// Get donations for a specific campaign
app.get('/api/campaigns/:campaignId/donations', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const { campaignId } = req.params;
    
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT donor_address, amount, tx_hash, created_at FROM donations WHERE campaign_id = ? ORDER BY created_at DESC',
        [campaignId]
      );
      
      res.json({ donations: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Get donations by donor address
app.get('/api/donations/donor/:donorAddress', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' });
    }
    
    const { donorAddress } = req.params;
    
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          d.campaign_id, d.amount, d.tx_hash, d.created_at,
          c.title as campaign_title, c.organization_name
        FROM donations d
        JOIN campaigns c ON d.campaign_id = c.id
        WHERE d.donor_address = ?
        ORDER BY d.created_at DESC
      `, [donorAddress]);
      
      res.json({ donations: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error fetching donor donations:', error);
    res.status(500).json({ error: 'Failed to fetch donor donations' });
  }
});

// Store campaign transaction
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

// Catch-all OPTIONS handler for any missed preflight requests
app.options('*', (req, res) => {
  const origin = req.get('Origin');
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD,CONNECT,TRACE');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// Start server
app.listen(PORT, async () => {
  console.log(`DonorSpark API server running on port ${PORT}`);
  await initializeDatabase();
});

export default app; 