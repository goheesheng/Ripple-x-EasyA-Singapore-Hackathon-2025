import mysql from 'mysql2/promise';

async function checkDatabase() {
  try {
    // First check if we can connect to MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root'
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Check if donorspark database exists
    const [databases] = await connection.query('SHOW DATABASES');
    const donorsparkExists = databases.some(db => db.Database === 'donorspark');
    
    if (donorsparkExists) {
      console.log('✅ Database "donorspark" exists');
      
      // Connect to the donorspark database
      await connection.query('USE donorspark');
      
      // Check if the campaign_transactions table exists
      const [tables] = await connection.query('SHOW TABLES');
      const tableExists = tables.some(table => table.Tables_in_donorspark === 'campaign_transactions');
      
      if (tableExists) {
        console.log('✅ Table "campaign_transactions" exists');
        
        // Show table structure
        const [structure] = await connection.query('DESCRIBE campaign_transactions');
        console.log('\n📋 Table structure:');
        structure.forEach(column => {
          console.log(`  - ${column.Field}: ${column.Type} ${column.Key ? `(${column.Key})` : ''} ${column.Extra ? column.Extra : ''}`);
        });
        
        // Count records
        const [count] = await connection.execute('SELECT COUNT(*) as count FROM campaign_transactions');
        console.log(`\n📊 Number of records: ${count[0].count}`);
        
        // Show sample records if any exist
        if (count[0].count > 0) {
          const [records] = await connection.execute('SELECT * FROM campaign_transactions ORDER BY created_at DESC LIMIT 5');
          console.log('\n📝 Latest records:');
          records.forEach(record => {
            console.log(`  - Campaign: ${record.campaign_id}, TX: ${record.tx_hash}, Created: ${record.created_at}`);
          });
        }
        
      } else {
        console.log('❌ Table "campaign_transactions" does not exist');
        console.log('\n💡 You can create it with this command:');
        console.log(`CREATE TABLE campaign_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id VARCHAR(255) NOT NULL,
    tx_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_campaign_id (campaign_id)
);`);
      }
    } else {
      console.log('❌ Database "donorspark" does not exist');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error connecting to MySQL:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   Make sure MySQL is running and credentials are correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   Make sure MySQL server is running on localhost:3306');
    }
  }
}

checkDatabase(); 