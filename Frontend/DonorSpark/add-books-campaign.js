import mysql from 'mysql2/promise';

// Create MySQL connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'donorspark',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addBooksCampaign() {
  try {
    console.log('🔍 Adding "Books for Every Child" campaign to database...');
    
    const connection = await pool.getConnection();
    
    try {
      // Calculate end date (7 days from now)
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mysqlEndDate = endDate.toISOString().slice(0, 19).replace('T', ' ');
      
      // Check if campaign already exists
      const [existing] = await connection.execute(
        'SELECT id FROM campaigns WHERE id = ?',
        ['books-for-every-child']
      );
      
      if (existing.length > 0) {
        console.log('📋 Campaign already exists in database');
        return;
      }
      
      // Insert the new campaign
      await connection.execute(`
        INSERT INTO campaigns (
          id, title, description, target_amount, current_amount, end_date, category,
          organization_id, organization_name, organization_description,
          organization_website, image_url, campaign_wallet_address, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'books-for-every-child',
        'Books for Every Child',
        'A campaign to provide learning materials to underprivileged students in Singapore.',
        1000,
        500,
        mysqlEndDate,
        'education',
        'rUeUuomy1NfZqX5o9xexEhzd9vgb1qCkJD',
        'SG Learning Foundation',
        'A registered non-profit helping kids access education.',
        'https://sglearning.org',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
        'rBooksForEveryChildWallet123456789',
        'active'
      ]);
      
      console.log('✅ Successfully added "Books for Every Child" campaign to database');
      
      // Verify the campaign was added
      const [result] = await connection.execute(
        'SELECT * FROM campaigns WHERE id = ?',
        ['books-for-every-child']
      );
      
      console.log('📋 Campaign details:', result[0]);
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Error adding campaign:', error);
  } finally {
    await pool.end();
  }
}

addBooksCampaign(); 