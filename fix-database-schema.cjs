const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema issues...');

    // Fix orders table - add missing columns
    console.log('📦 Fixing orders table...');
    const hasOrdersTable = await knex.schema.hasTable('orders');
    if (hasOrdersTable) {
      const ordersColumns = ['created_by', 'customer_email', 'delivery_address', 'storekeeper_authorized', 'authorization_time', 'authorization_by', 'assigned_driver_id'];
      for (const column of ordersColumns) {
        const hasColumn = await knex.schema.hasColumn('orders', column);
        if (!hasColumn) {
          await knex.schema.table('orders', (table) => {
            if (column === 'created_by' || column === 'authorization_by' || column === 'assigned_driver_id') {
              table.integer(column).unsigned().references('id').inTable('employees').nullable();
            } else if (column === 'storekeeper_authorized') {
              table.boolean(column).defaultTo(false);
            } else if (column === 'authorization_time') {
              table.datetime(column);
            } else {
              table.string(column);
            }
          });
          console.log(`✅ Added column ${column} to orders`);
        }
      }
    }

    // Fix system_activity table - add missing columns
    console.log('📊 Fixing system_activity table...');
    const hasSystemActivityTable = await knex.schema.hasTable('system_activity');
    if (hasSystemActivityTable) {
      const systemActivityColumns = ['action'];
      for (const column of systemActivityColumns) {
        const hasColumn = await knex.schema.hasColumn('system_activity', column);
        if (!hasColumn) {
          await knex.schema.table('system_activity', (table) => {
            table.string(column);
          });
          console.log(`✅ Added column ${column} to system_activity`);
        }
      }
    }

    // Fix inventory_logs table - add missing columns
    console.log('📋 Fixing inventory_logs table...');
    const hasInventoryLogsTable = await knex.schema.hasTable('inventory_logs');
    if (hasInventoryLogsTable) {
      const inventoryLogsColumns = ['performed_by', 'operation_type', 'bags_added', 'bags_removed', 'current_stock', 'order_id', 'order_number'];
      for (const column of inventoryLogsColumns) {
        const hasColumn = await knex.schema.hasColumn('inventory_logs', column);
        if (!hasColumn) {
          await knex.schema.table('inventory_logs', (table) => {
            if (column === 'performed_by') {
              table.integer(column).unsigned().references('id').inTable('employees').nullable();
            } else if (column === 'order_id') {
              table.integer(column).unsigned().references('id').inTable('orders').nullable();
            } else if (column.includes('bags') || column === 'current_stock') {
              table.decimal(column, 10, 2).defaultTo(0);
            } else if (column === 'operation_type') {
              table.string(column);
            } else if (column === 'order_number') {
              table.string(column);
            }
          });
          console.log(`✅ Added column ${column} to inventory_logs`);
        }
      }
    }

    // Fix driver_sales_logs table - add missing columns
    console.log('🚚 Fixing driver_sales_logs table...');
    const hasDriverSalesLogsTable = await knex.schema.hasTable('driver_sales_logs');
    if (hasDriverSalesLogsTable) {
      const driverSalesLogsColumns = ['driver_id', 'order_id', 'bags_sold', 'bags_returned', 'total_sales', 'commission_earned', 'money_submitted', 'approval_status', 'approved_by', 'approval_notes', 'approved_at', 'rejected_by', 'rejection_notes', 'rejected_at', 'receptionist_id', 'notes'];
      for (const column of driverSalesLogsColumns) {
        const hasColumn = await knex.schema.hasColumn('driver_sales_logs', column);
        if (!hasColumn) {
          await knex.schema.table('driver_sales_logs', (table) => {
            if (column === 'driver_id' || column === 'receptionist_id' || column === 'approved_by' || column === 'rejected_by') {
              table.integer(column).unsigned().references('id').inTable('employees').nullable();
            } else if (column === 'order_id') {
              table.integer(column).unsigned().references('id').inTable('orders').nullable();
            } else if (column.includes('bags') || column.includes('total_sales') || column.includes('commission_earned') || column.includes('money_submitted')) {
              table.decimal(column, 10, 2).defaultTo(0);
            } else if (column.includes('status')) {
              table.string(column).defaultTo('Pending');
            } else if (column.includes('notes')) {
              table.text(column);
            } else if (column.includes('_at')) {
              table.datetime(column);
            } else {
              table.string(column);
            }
          });
          console.log(`✅ Added column ${column} to driver_sales_logs`);
        }
      }
    }

    console.log('✅ Database schema fixes completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
  } finally {
    await knex.destroy();
  }
}

fixDatabaseSchema();
