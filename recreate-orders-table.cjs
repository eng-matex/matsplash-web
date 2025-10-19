const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

async function recreateOrdersTable() {
  try {
    console.log('🔄 Recreating orders table...');
    
    // Drop the existing orders table
    const hasOrdersTable = await db.schema.hasTable('orders');
    if (hasOrdersTable) {
      await db.schema.dropTable('orders');
      console.log('✅ Dropped existing orders table');
    }
    
    // Create the orders table with the correct schema
    await db.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('order_number').unique().notNullable();
      table.string('customer_name').notNullable();
      table.string('customer_phone');
      table.string('customer_email');
      table.string('order_type').notNullable();
      table.string('status').defaultTo('pending').notNullable();
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('payment_method');
      table.string('payment_status').defaultTo('pending');
      table.integer('created_by').unsigned().references('id').inTable('employees');
      table.json('items').notNullable();
      table.text('notes');
      table.text('delivery_address');
      table.timestamps(true, true);
    });
    
    console.log('✅ Created orders table with correct schema');
    
    // Test the table by inserting a test record
    const testOrder = {
      order_number: 'TEST-001',
      customer_name: 'Test Customer',
      order_type: 'general_sales',
      status: 'pending',
      total_amount: 0,
      items: JSON.stringify([{product_name: 'Test Product', quantity: 1, unit_price: 0}]),
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const [orderId] = await db('orders').insert(testOrder);
    console.log('✅ Test order inserted with ID:', orderId);
    
    // Get the inserted order
    const insertedOrder = await db('orders').where('id', orderId).first();
    console.log('✅ Inserted order:', insertedOrder);
    
    // Clean up
    await db('orders').where('id', orderId).del();
    console.log('✅ Test order deleted');
    
  } catch (error) {
    console.error('❌ Error recreating orders table:', error);
  } finally {
    db.destroy();
  }
}

recreateOrdersTable();
