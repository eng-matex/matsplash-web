const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

async function testEmployeesTable() {
  try {
    console.log('🔍 Testing employees table...');
    
    // Check if employees table exists
    const hasEmployeesTable = await db.schema.hasTable('employees');
    console.log('Employees table exists:', hasEmployeesTable);
    
    if (hasEmployeesTable) {
      // Get table structure
      const tableInfo = await db.raw("PRAGMA table_info(employees)");
      console.log('Employees table structure:', tableInfo);
      
      // Try to get count
      const count = await db('employees').count('id as count').first();
      console.log('Employees count:', count);
    }
    
  } catch (error) {
    console.error('❌ Error testing employees table:', error);
  } finally {
    db.destroy();
  }
}

testEmployeesTable();
