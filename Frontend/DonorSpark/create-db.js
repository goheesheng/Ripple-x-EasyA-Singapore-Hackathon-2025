import mysql from 'mysql2/promise';

async function createDatabase() {
  try {
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root'
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create the donorspark database
    await connection.execute('CREATE DATABASE IF NOT EXISTS donorspark');
    console.log('✅ Database "donorspark" created');
    
    // Switch to the donorspark database
    await connection.execute('USE donorspark');
    console.log('✅ Using donorspark database');
    
    // Create the campaign_transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS campaign_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id VARCHAR(255) NOT NULL,
        tx_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_campaign_id (campaign_id)
      )
    `);
    console.log('✅ Table "campaign_transactions" created');
    
    // Show the table structure
    const [structure] = await connection.execute('DESCRIBE campaign_transactions');
    console.log('\n📋 Table structure:');
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Key ? `(${column.Key})` : ''} ${column.Extra ? column.Extra : ''}`);
    });
    
    await connection.end();
    console.log('\n🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  }
}

createDatabase(); 