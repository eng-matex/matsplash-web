const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

async function testOrdersTable() {
  try {
    console.log('🔍 Testing orders table...');
    
    // Check if orders table exists
    const hasOrdersTable = await db.schema.hasTable('orders');
    console.log('Orders table exists:', hasOrdersTable);
    
    if (hasOrdersTable) {
      // Get table structure
      const tableInfo = await db.raw("PRAGMA table_info(orders)");
      console.log('Orders table structure:', tableInfo);
      
      // Try to get count
      const count = await db('orders').count('id as count').first();
      console.log('Orders count:', count);
      
      // Try to insert a test record
      const testOrder = {
        order_number: 'TEST-001',
        customer_name: 'Test Customer',
        order_type: 'general_sales',
        status: 'pending',
        total_amount: 0,
        items: JSON.stringify([{product_name: 'Test Product', quantity: 1, unit_price: 0}]),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const [orderId] = await db('orders').insert(testOrder);
      console.log('Test order inserted with ID:', orderId);
      
      // Try to get the inserted order
      const insertedOrder = await db('orders').where('id', orderId).first();
      console.log('Inserted order:', insertedOrder);
      
      // Clean up
      await db('orders').where('id', orderId).del();
      console.log('Test order deleted');
    }
    
  } catch (error) {
    console.error('❌ Error testing orders table:', error);
  } finally {
    db.destroy();
  }
}

testOrdersTable();
