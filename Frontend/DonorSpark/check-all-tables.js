import mysql from 'mysql2/promise';

async function checkAllTables() {
  try {
    // Connect to donorspark database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'donorspark'
    });
    
    console.log('✅ Connected to donorspark database');
    
    // Show all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.Tables_in_donorspark}`);
    });
    
    // Check each table
    for (const table of tables) {
      const tableName = table.Tables_in_donorspark;
      console.log(`\n📊 Table: ${tableName}`);
      
      // Show structure
      const [structure] = await connection.query(`DESCRIBE ${tableName}`);
      console.log('  Structure:');
      structure.forEach(column => {
        console.log(`    - ${column.Field}: ${column.Type} ${column.Key ? `(${column.Key})` : ''} ${column.Extra ? column.Extra : ''}`);
      });
      
      // Count records
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  Records: ${count[0].count}`);
      
      // Show sample data if any exists
      if (count[0].count > 0) {
        const [records] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
        console.log('  Sample records:');
        records.forEach((record, index) => {
          console.log(`    ${index + 1}. ${JSON.stringify(record, null, 2).slice(0, 200)}...`);
        });
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllTables(); 