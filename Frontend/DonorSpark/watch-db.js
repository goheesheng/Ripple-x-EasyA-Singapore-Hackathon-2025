import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'donorspark'
});

console.log('🔍 Watching database for new campaign transactions...');
console.log('Press Ctrl+C to stop\n');

let lastCount = 0;

const checkDatabase = async () => {
  try {
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM campaign_transactions');
    const currentCount = rows[0].count;
    
    if (currentCount > lastCount) {
      console.log(`🆕 New transaction detected! Total records: ${currentCount}`);
      
      // Get the latest record
      const [latest] = await connection.execute(
        'SELECT * FROM campaign_transactions ORDER BY created_at DESC LIMIT 1'
      );
      
      if (latest.length > 0) {
        const record = latest[0];
        console.log('📝 Latest record:');
        console.log(`   Campaign ID: ${record.campaign_id}`);
        console.log(`   TX Hash: ${record.tx_hash}`);
        console.log(`   Created: ${record.created_at}`);
        console.log('');
      }
      
      lastCount = currentCount;
    }
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
};

// Initial check
const [rows] = await connection.execute('SELECT COUNT(*) as count FROM campaign_transactions');
lastCount = rows[0].count;
console.log(`📊 Current records in database: ${lastCount}\n`);

// Check every 2 seconds
setInterval(checkDatabase, 2000); 