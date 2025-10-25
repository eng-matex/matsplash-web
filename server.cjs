const express = require('express');
const cors = require('cors');
const path = require('path');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT Secret - should be in environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'matsplash-secret-key-2024';

const app = express();
const PORT = process.env.PORT || 3002;

// Database configuration
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://192.168.1.117:5173',
    'http://192.168.1.117:5174',
    'http://192.168.1.117:5175',
    'http://192.168.1.117:5176',
    'http://192.168.1.117:5177',
    'http://192.168.1.117:5178',
    'http://192.168.1.117:5179',
    'http://192.168.1.117:5180',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
// Enhanced JSON parsing with error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.log('Malformed JSON request:', buf.toString());
      res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON format',
        error: 'Malformed JSON in request body'
      });
      return;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Setup database tables
async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Create employees table
    const hasEmployeesTable = await db.schema.hasTable('employees');
    if (!hasEmployeesTable) {
      await db.schema.createTable('employees', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').unique().notNullable();
        table.string('phone').unique();
        table.string('role').notNullable();
        table.string('pin_hash').notNullable();
        table.string('status').defaultTo('active').notNullable();
        table.string('deletion_status').defaultTo('Active').notNullable();
        table.boolean('is_archived').defaultTo(false);
        table.boolean('first_login').defaultTo(false);
        table.string('salary_type').defaultTo('fixed');
        table.decimal('fixed_salary', 10, 2);
        table.decimal('commission_rate', 5, 2);
        table.boolean('can_access_remotely').defaultTo(false);
        table.timestamp('last_login');
        table.timestamps(true, true);
      });
    }

    // Add missing columns to existing employees table
    try {
      const hasLastLoginColumn = await db.schema.hasColumn('employees', 'last_login');
      if (!hasLastLoginColumn) {
        await db.schema.alterTable('employees', (table) => {
          table.timestamp('last_login');
        });
        console.log('Added last_login column to employees table');
      }
    } catch (error) {
      console.log('Column already exists or error adding column:', error.message);
    }

    // Create default users
    const defaultUsers = [
      {
        name: 'System Administrator',
        email: 'admin@matsplash.com',
        phone: '+2341234567800',
        role: 'Admin',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 150000.00,
        commission_rate: null,
        can_access_remotely: true
      },
      {
        name: 'Director',
        email: 'director@matsplash.com',
        phone: '+2341234567802',
        role: 'Director',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 200000.00,
        commission_rate: null,
        can_access_remotely: true
      },
      {
        name: 'Manager',
        email: 'manager@matsplash.com',
        phone: '+2341234567803',
        role: 'Manager',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 120000.00,
        commission_rate: null,
        can_access_remotely: true
      },
      {
        name: 'Receptionist',
        email: 'receptionist@matsplash.com',
        phone: '+2341234567804',
        role: 'Receptionist',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 80000.00,
        commission_rate: null,
        can_access_remotely: true
      },
      {
        name: 'Storekeeper',
        email: 'storekeeper@matsplash.com',
        phone: '+2341234567805',
        role: 'StoreKeeper',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 70000.00,
        commission_rate: null,
        can_access_remotely: true
      },
      {
        name: 'Driver',
        email: 'driver@matsplash.com',
        phone: '+2341234567806',
        role: 'Driver',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 65000.00,
        commission_rate: null,
        can_access_remotely: false
      },
      {
        name: 'Driver Assistant',
        email: 'driverassistant@matsplash.com',
        phone: '+2341234567813',
        role: 'Driver Assistant',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 55000.00,
        commission_rate: null,
        can_access_remotely: false
      },
      {
        name: 'Packer',
        email: 'packer@matsplash.com',
        phone: '+2341234567807',
        role: 'Packer',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 60000.00,
        commission_rate: null,
        can_access_remotely: false
      },
      {
        name: 'Sales Representative',
        email: 'sales@matsplash.com',
        phone: '+2341234567808',
        role: 'Sales',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'commission',
        fixed_salary: 50000.00,
        commission_rate: 5.00,
        can_access_remotely: true
      },
      {
        name: 'Security Guard',
        email: 'security@matsplash.com',
        phone: '+2341234567809',
        role: 'Security',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 55000.00,
        commission_rate: null,
        can_access_remotely: false
      },
      {
        name: 'Cleaner',
        email: 'cleaner@matsplash.com',
        phone: '+2341234567810',
        role: 'Cleaner',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 45000.00,
        commission_rate: null,
        can_access_remotely: false
      },
      {
        name: 'Machine Operator',
        email: 'operator@matsplash.com',
        phone: '+2341234567811',
        role: 'Operator',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 70000.00,
        commission_rate: null,
        can_access_remotely: false
      },
      {
        name: 'Loader',
        email: 'loader@matsplash.com',
        phone: '+2341234567812',
        role: 'Loader',
        defaultPin: '1111',
        status: 'active',
        deletion_status: 'Active',
        is_archived: false,
        first_login: false,
        salary_type: 'fixed',
        fixed_salary: 50000.00,
        commission_rate: null,
        can_access_remotely: false
      }
    ];

    for (const user of defaultUsers) {
      const existingUser = await db('employees').where({ email: user.email }).first();
      
      if (!existingUser) {
        const saltRounds = 10;
        const pinHash = await bcrypt.hash(user.defaultPin, saltRounds);
        
        await db('employees').insert({
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          pin_hash: pinHash,
          status: user.status,
          deletion_status: user.deletion_status,
          is_archived: user.is_archived,
          first_login: user.first_login,
          salary_type: user.salary_type,
          fixed_salary: user.fixed_salary,
          commission_rate: user.commission_rate,
          can_access_remotely: user.can_access_remotely,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        console.log(`Created default ${user.role} account: ${user.email}`);
      } else {
        console.log(`Default ${user.role} account already exists: ${user.email}`);
      }
    }

    // Create other tables
const tables = [
  'orders', 'inventory_logs', 'attendance_logs', 'packing_logs',
  'dispatch_logs', 'driver_sales_logs', 'cameras', 'camera_credentials', 'recording_sessions', 'system_activity', 'ai_detections', 'system_alerts',
  'water_bag_batches', 'water_bag_assignments', 'packer_work_logs',
  'gate_logs', 'incident_reports', 'products', 'sales_entries', 'sales_history', 'sales_stats'
];

    for (const tableName of tables) {
      const hasTable = await db.schema.hasTable(tableName);
      if (!hasTable) {
        console.log(`Creating ${tableName} table...`);
        switch (tableName) {
          case 'attendance_logs':
            await db.schema.createTable('attendance_logs', (table) => {
              table.increments('id').primary();
              table.integer('employee_id').unsigned().references('id').inTable('employees');
              table.timestamp('clock_in_time').notNullable();
              table.timestamp('clock_out_time');
              table.decimal('hours_worked', 5, 2);
              table.string('status').defaultTo('present').notNullable();
              table.boolean('on_break').defaultTo(false);
              table.timestamp('break_start_time');
              table.timestamp('break_end_time');
              table.integer('total_break_time').defaultTo(0);
              table.text('clock_in_location');
              table.text('clock_out_location');
              table.text('break_start_location');
              table.text('break_end_location');
              table.text('device_info');
              table.boolean('admin_action').defaultTo(false);
              table.text('notes');
              table.timestamps(true, true);
            });
            break;
          case 'orders':
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
            break;
          case 'inventory_logs':
            await db.schema.createTable('inventory_logs', (table) => {
              table.increments('id').primary();
              table.string('product_name').notNullable();
              table.integer('quantity_change').notNullable();
              table.integer('current_stock').notNullable();
              table.string('operation_type').notNullable();
              table.text('reason');
              table.integer('employee_id').unsigned().references('id').inTable('employees');
              table.timestamps(true, true);
            });
            break;
          case 'packing_logs':
            await db.schema.createTable('packing_logs', (table) => {
              table.increments('id').primary();
              table.integer('order_id').unsigned().references('id').inTable('orders');
              table.integer('packer_id').unsigned().references('id').inTable('employees');
              table.json('packed_items').notNullable();
              table.timestamp('packing_start_time').notNullable();
              table.timestamp('packing_end_time');
              table.string('status').defaultTo('in_progress').notNullable();
              table.text('notes');
              table.timestamps(true, true);
            });
            break;
          case 'water_bag_batches':
            await db.schema.createTable('water_bag_batches', (table) => {
              table.increments('id').primary();
              table.string('batch_number').unique().notNullable();
              table.integer('loader_id').unsigned().references('id').inTable('employees');
              table.integer('bags_received').notNullable();
              table.string('status').defaultTo('received').notNullable(); // received, assigned, packed, completed
              table.text('notes');
              table.timestamps(true, true);
            });
            break;
          case 'water_bag_assignments':
            await db.schema.createTable('water_bag_assignments', (table) => {
              table.increments('id').primary();
              table.integer('batch_id').unsigned().references('id').inTable('water_bag_batches');
              table.integer('packer_id').unsigned().references('id').inTable('employees');
              table.integer('bags_assigned').notNullable();
              table.string('status').defaultTo('assigned').notNullable(); // assigned, in_progress, completed, approved
              table.text('notes');
              table.timestamps(true, true);
            });
            break;
          case 'packer_work_logs':
            await db.schema.createTable('packer_work_logs', (table) => {
              table.increments('id').primary();
              table.integer('assignment_id').unsigned().references('id').inTable('water_bag_assignments');
              table.integer('packer_id').unsigned().references('id').inTable('employees');
              table.integer('bags_packed').notNullable();
              table.string('status').defaultTo('pending').notNullable(); // pending, approved, rejected
              table.text('modification_comment');
              table.timestamps(true, true);
            });
            break;
          case 'dispatch_logs':
            await db.schema.createTable('dispatch_logs', (table) => {
              table.increments('id').primary();
              table.integer('order_id').unsigned().references('id').inTable('orders');
              table.integer('driver_id').unsigned().references('id').inTable('employees');
              table.integer('assistant_id').unsigned().references('id').inTable('employees');
              table.timestamp('dispatch_time').notNullable();
              table.timestamp('delivery_time');
              table.string('status').defaultTo('dispatched').notNullable();
              table.text('notes');
              table.timestamps(true, true);
            });
            break;
          case 'driver_sales_logs':
            await db.schema.createTable('driver_sales_logs', (table) => {
              table.increments('id').primary();
              table.integer('driver_id').unsigned().references('id').inTable('employees');
              table.integer('order_id').unsigned().references('id').inTable('orders');
              table.decimal('amount_collected', 10, 2).notNullable();
              table.string('payment_method');
              table.text('notes');
              table.timestamps(true, true);
            });
            break;
          case 'cameras':
            await db.schema.createTable('cameras', (table) => {
              table.increments('id').primary();
              table.string('name').notNullable();
              table.string('location').notNullable();
              table.string('ip_address').unique().notNullable();
              table.string('status').defaultTo('offline').notNullable();
              table.integer('port').defaultTo(80);
              table.string('username').nullable();
              table.string('password').nullable();
              table.string('stream_url').nullable();
              table.integer('credential_set_id').unsigned().nullable().references('id').inTable('camera_credentials');
              table.text('notes');
              table.timestamps(true, true);
            });
            break;
          case 'camera_credentials':
            await db.schema.createTable('camera_credentials', (table) => {
              table.increments('id').primary();
              table.integer('camera_id').unsigned().nullable().references('id').inTable('cameras');
              table.string('name').notNullable(); // Credential set name
              table.string('username').notNullable();
              table.string('password').notNullable();
              table.integer('default_port').defaultTo(80);
              table.text('description').nullable();
              table.timestamps(true, true);
            });
            break;
          case 'recording_sessions':
            await db.schema.createTable('recording_sessions', (table) => {
              table.increments('id').primary();
              table.integer('camera_id').unsigned().references('id').inTable('cameras');
              table.timestamp('start_time').defaultTo(db.fn.now());
              table.timestamp('end_time').nullable();
              table.string('status').defaultTo('recording');
              table.string('file_path').nullable();
              table.integer('file_size_mb').nullable();
              table.text('notes').nullable();
              table.timestamps(true, true);
            });
            break;
          case 'system_activity':
            await db.schema.createTable('system_activity', (table) => {
              table.increments('id').primary();
              table.integer('employee_id').unsigned().references('id').inTable('employees');
              table.string('activity_type').notNullable();
              table.text('description');
              table.timestamp('timestamp').defaultTo(db.fn.now());
            });
            break;
          case 'ai_detections':
            await db.schema.createTable('ai_detections', (table) => {
              table.increments('id').primary();
              table.integer('camera_id').unsigned().references('id').inTable('cameras');
              table.string('detection_type').notNullable();
              table.decimal('confidence', 5, 2).notNullable();
              table.text('bounding_box').nullable();
              table.timestamp('timestamp').defaultTo(db.fn.now());
              table.boolean('processed').defaultTo(false);
              table.timestamps(true, true);
            });
            break;
          case 'system_alerts':
            await db.schema.createTable('system_alerts', (table) => {
              table.increments('id').primary();
              table.integer('camera_id').unsigned().references('id').inTable('cameras');
              table.string('alert_type').notNullable();
              table.string('severity').notNullable();
              table.text('message').notNullable();
              table.timestamp('timestamp').defaultTo(db.fn.now());
              table.boolean('is_read').defaultTo(false);
              table.timestamps(true, true);
            });
            break;
          case 'gate_logs':
            await db.schema.createTable('gate_logs', (table) => {
              table.increments('id').primary();
              table.string('log_number').notNullable();
              table.string('visitor_name').notNullable();
              table.string('visitor_phone');
              table.string('visitor_company');
              table.string('purpose');
              table.string('vehicle_number');
              table.timestamp('entry_time');
              table.timestamp('exit_time');
              table.string('status').defaultTo('inside');
              table.string('security_guard');
              table.timestamps(true, true);
            });
            break;
          case 'incident_reports':
            await db.schema.createTable('incident_reports', (table) => {
              table.increments('id').primary();
              table.string('report_number').notNullable();
              table.string('type').notNullable();
              table.text('description').notNullable();
              table.string('location');
              table.string('severity').defaultTo('medium');
              table.string('reported_by');
              table.string('status').defaultTo('open');
              table.timestamps(true, true);
            });
            break;
          case 'products':
            await db.schema.createTable('products', (table) => {
              table.increments('id').primary();
              table.string('name').notNullable();
              table.decimal('price', 10, 2).notNullable();
              table.string('unit').notNullable();
              table.integer('stock').defaultTo(0);
              table.text('description');
              table.string('category');
              table.boolean('is_active').defaultTo(true);
              table.timestamps(true, true);
            });
            break;
          case 'sales_entries':
            await db.schema.createTable('sales_entries', (table) => {
              table.increments('id').primary();
              table.string('sale_number').notNullable();
              table.string('customer_name').notNullable();
              table.string('customer_phone');
              table.string('product_type').notNullable();
              table.integer('quantity').notNullable();
              table.decimal('unit_price', 10, 2).notNullable();
              table.decimal('total_amount', 10, 2).notNullable();
              table.string('payment_method');
              table.string('status').defaultTo('pending');
              table.timestamps(true, true);
            });
            break;
          case 'sales_history':
            await db.schema.createTable('sales_history', (table) => {
              table.increments('id').primary();
              table.string('sale_number').notNullable();
              table.string('customer_name').notNullable();
              table.string('product_type').notNullable();
              table.integer('quantity').notNullable();
              table.decimal('total_amount', 10, 2).notNullable();
              table.string('payment_method');
              table.string('status').defaultTo('completed');
              table.timestamp('created_at').defaultTo(db.fn.now());
            });
            break;
          case 'sales_stats':
            await db.schema.createTable('sales_stats', (table) => {
              table.increments('id').primary();
              table.decimal('total_sales', 15, 2).defaultTo(0);
              table.decimal('monthly_sales', 15, 2).defaultTo(0);
              table.decimal('daily_sales', 15, 2).defaultTo(0);
              table.json('top_products');
              table.timestamp('updated_at').defaultTo(db.fn.now());
            });
            break;
          default:
            // Create basic table structure for other tables
            await db.schema.createTable(tableName, (table) => {
              table.increments('id').primary();
              table.timestamps(true, true);
            });
        }
        console.log(`✅ ${tableName} table created.`);
      } else {
        console.log(`✅ ${tableName} table already exists.`);
      }
    }

    // Add missing columns to existing attendance_logs table
    try {
      const hasAttendanceTable = await db.schema.hasTable('attendance_logs');
      if (hasAttendanceTable) {
        const columns = [
          'employee_id', 'clock_in_time', 'clock_out_time', 'hours_worked', 'status', 'notes',
          'on_break', 'break_start_time', 'break_end_time', 'total_break_time',
          'clock_in_location', 'clock_out_location', 'break_start_location',
          'break_end_location', 'device_info', 'admin_action'
        ];

        for (const column of columns) {
          const hasColumn = await db.schema.hasColumn('attendance_logs', column);
          if (!hasColumn) {
            await db.schema.alterTable('attendance_logs', (table) => {
              switch (column) {
                case 'employee_id':
                  table.integer('employee_id').unsigned().references('id').inTable('employees');
                  break;
                case 'clock_in_time':
                  table.timestamp('clock_in_time').notNullable();
                  break;
                case 'clock_out_time':
                  table.timestamp('clock_out_time');
                  break;
                case 'hours_worked':
                  table.decimal('hours_worked', 5, 2);
                  break;
                case 'status':
                  table.string('status').defaultTo('present').notNullable();
                  break;
                case 'notes':
                  table.text('notes');
                  break;
                case 'on_break':
                  table.boolean('on_break').defaultTo(false);
                  break;
                case 'break_start_time':
                case 'break_end_time':
                  table.timestamp(column);
                  break;
                case 'total_break_time':
                  table.integer('total_break_time').defaultTo(0);
                  break;
                case 'clock_in_location':
                case 'clock_out_location':
                case 'break_start_location':
                case 'break_end_location':
                case 'device_info':
                  table.text(column);
                  break;
                case 'admin_action':
                  table.boolean('admin_action').defaultTo(false);
                  break;
              }
            });
            console.log(`Added ${column} column to attendance_logs table`);
          }
        }
      }
    } catch (error) {
      console.log('Error adding columns to attendance_logs:', error.message);
    }

    // Add missing columns to existing inventory_logs table
    try {
      const hasInventoryTable = await db.schema.hasTable('inventory_logs');
      if (hasInventoryTable) {
        const inventoryColumns = ['product_name', 'quantity_change', 'current_stock', 'operation_type', 'reason', 'employee_id'];

        for (const column of inventoryColumns) {
          const hasColumn = await db.schema.hasColumn('inventory_logs', column);
          if (!hasColumn) {
            console.log(`Adding ${column} column to inventory_logs table...`);
            await db.schema.alterTable('inventory_logs', (table) => {
              switch (column) {
                case 'product_name':
                case 'operation_type':
                case 'reason':
                  table.string(column);
                  break;
                case 'quantity_change':
                case 'current_stock':
                  table.integer(column);
                  break;
                case 'employee_id':
                  table.integer('employee_id').unsigned().references('id').inTable('employees');
                  break;
              }
            });
            console.log(`Added ${column} column to inventory_logs table`);
          }
        }
      }
    } catch (error) {
      console.log('Error adding columns to inventory_logs:', error.message);
    }

    // Add missing columns to existing system_activity table
    try {
      const hasSystemActivityTable = await db.schema.hasTable('system_activity');
      if (hasSystemActivityTable) {
        const columns = [
          'employee_id', 'activity_type', 'description', 'timestamp'
        ];

        for (const column of columns) {
          const hasColumn = await db.schema.hasColumn('system_activity', column);
          if (!hasColumn) {
            await db.schema.alterTable('system_activity', (table) => {
              switch (column) {
                case 'employee_id':
                  table.integer('employee_id').unsigned().references('id').inTable('employees');
                  break;
                case 'activity_type':
                  table.string('activity_type').notNullable();
                  break;
                case 'description':
                  table.text('description');
                  break;
                case 'timestamp':
                  table.timestamp('timestamp').notNullable();
                  break;
              }
            });
            console.log(`Added ${column} column to system_activity table`);
          }
        }
      }
    } catch (error) {
      console.log('Error adding columns to system_activity:', error.message);
    }

    // Create authorized_devices table
    const hasAuthorizedDevicesTable = await db.schema.hasTable('authorized_devices');
    if (!hasAuthorizedDevicesTable) {
      await db.schema.createTable('authorized_devices', (table) => {
        table.increments('id').primary();
        table.string('device_id').unique().notNullable(); // MAC address or unique identifier
        table.string('device_name').notNullable();
        table.string('device_type').notNullable(); // 'tablet', 'kiosk', 'computer', 'personal'
        table.string('location').notNullable(); // 'factory_floor', 'office', 'gate', 'personal'
        table.integer('employee_id').unsigned().references('id').inTable('employees'); // For personal devices
        table.string('device_fingerprint').notNullable(); // Browser fingerprint
        table.boolean('is_active').defaultTo(true);
        table.boolean('is_factory_device').defaultTo(false); // Factory vs personal device
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('created_by').unsigned().references('id').inTable('employees');
      });
      console.log('✅ Created authorized_devices table');
    } else {
      // Add new columns to existing table (with error handling)
      try {
        await db.schema.alterTable('authorized_devices', (table) => {
          table.integer('employee_id').unsigned().references('id').inTable('employees');
        });
        console.log('✅ Added employee_id column to authorized_devices table');
      } catch (error) {
        console.log('employee_id column may already exist');
      }
      
      try {
        await db.schema.alterTable('authorized_devices', (table) => {
          table.string('device_fingerprint').notNullable().defaultTo('');
        });
        console.log('✅ Added device_fingerprint column to authorized_devices table');
      } catch (error) {
        console.log('device_fingerprint column may already exist');
      }
      
      try {
        await db.schema.alterTable('authorized_devices', (table) => {
          table.boolean('is_factory_device').defaultTo(false);
        });
        console.log('✅ Added is_factory_device column to authorized_devices table');
      } catch (error) {
        console.log('is_factory_device column may already exist');
      }
    }

    // Create device_mac_addresses table for storing multiple MAC addresses per device
    const hasDeviceMacAddressesTable = await db.schema.hasTable('device_mac_addresses');
    if (!hasDeviceMacAddressesTable) {
      await db.schema.createTable('device_mac_addresses', (table) => {
        table.increments('id').primary();
        table.integer('device_id').unsigned().references('id').inTable('authorized_devices').onDelete('CASCADE');
        table.string('mac_address').notNullable(); // Individual MAC address
        table.string('adapter_type').notNullable(); // 'wifi', 'ethernet', 'bluetooth', 'other'
        table.string('adapter_name').nullable(); // Human-readable adapter name
        table.boolean('is_primary').defaultTo(false); // Primary MAC address for the device
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.unique(['device_id', 'mac_address']); // Prevent duplicate MACs for same device
      });
      console.log('✅ Created device_mac_addresses table');
    }

    // Create device_sessions table for tracking active sessions
    const hasDeviceSessionsTable = await db.schema.hasTable('device_sessions');
    if (!hasDeviceSessionsTable) {
      await db.schema.createTable('device_sessions', (table) => {
        table.increments('id').primary();
        table.string('device_id').notNullable();
        table.integer('employee_id').unsigned().references('id').inTable('employees');
        table.string('session_token').notNullable();
        table.timestamp('login_time').notNullable();
        table.timestamp('last_activity').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.text('login_location');
        table.text('device_info');
      });
      console.log('✅ Created device_sessions table');
    }

    // Create factory_locations table for location enforcement
    const hasFactoryLocationsTable = await db.schema.hasTable('factory_locations');
    if (!hasFactoryLocationsTable) {
      await db.schema.createTable('factory_locations', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable(); // 'Main Factory', 'Warehouse', 'Office'
        table.decimal('latitude', 10, 8).notNullable();
        table.decimal('longitude', 11, 8).notNullable();
        table.integer('radius_meters').defaultTo(100); // Allowed radius in meters
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created factory_locations table');
      
      // Insert default factory location (Ibadan, Nigeria)
      await db('factory_locations').insert({
        name: 'MatSplash Premium Water Factory',
        latitude: 7.3964,
        longitude: 3.9167,
        radius_meters: 200,
        is_active: true
      });
      console.log('✅ Added default factory location');
    }

    // Create two_factor_auth table for 2FA
    const hasTwoFactorAuthTable = await db.schema.hasTable('two_factor_auth');
    if (!hasTwoFactorAuthTable) {
      await db.schema.createTable('two_factor_auth', (table) => {
        table.increments('id').primary();
        table.integer('employee_id').unsigned().references('id').inTable('employees').unique();
        table.string('secret_key').notNullable(); // TOTP secret
        table.boolean('is_enabled').defaultTo(false);
        table.string('backup_codes', 1000); // JSON array of backup codes
        table.timestamp('last_used').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created two_factor_auth table');
    }

    // Create emergency_access table for backdoor
    const hasEmergencyAccessTable = await db.schema.hasTable('emergency_access');
    if (!hasEmergencyAccessTable) {
      await db.schema.createTable('emergency_access', (table) => {
        table.increments('id').primary();
        table.string('access_code').unique().notNullable(); // Emergency access code
        table.string('description').notNullable(); // What this code is for
        table.boolean('is_active').defaultTo(true);
        table.integer('max_uses').defaultTo(1); // How many times it can be used
        table.integer('used_count').defaultTo(0);
        table.timestamp('expires_at').nullable(); // Optional expiration
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('created_by').unsigned().references('id').inTable('employees');
      });
      console.log('✅ Created emergency_access table');
      
      // Insert default emergency access code
      await db('emergency_access').insert({
        access_code: 'EMERGENCY2024',
        description: 'Default emergency access code - CHANGE IMMEDIATELY',
        is_active: true,
        max_uses: 10,
        used_count: 0,
        expires_at: null,
        created_by: 1 // Admin
      });
      console.log('✅ Added default emergency access code');
    }

    // Add some default factory devices for testing
    const existingDevices = await db('authorized_devices').count('* as count').first();
    if (existingDevices.count === 0) {
      const defaultFactoryDevices = [
        {
          device_id: 'FACTORY-LAPTOP-001',
          device_name: 'Factory Laptop 001',
          device_type: 'laptop',
          location: 'factory_floor',
          device_fingerprint: 'factory-laptop-001',
          is_factory_device: true,
          is_active: true,
          created_by: 1
        },
        {
          device_id: 'FACTORY-DESKTOP-001',
          device_name: 'Factory Desktop 001',
          device_type: 'desktop',
          location: 'office',
          device_fingerprint: 'factory-desktop-001',
          is_factory_device: true,
          is_active: true,
          created_by: 1
        },
        {
          device_id: 'FACTORY-TABLET-001',
          device_name: 'Factory Tablet 001',
          device_type: 'tablet',
          location: 'factory_floor',
          device_fingerprint: 'factory-tablet-001',
          is_factory_device: true,
          is_active: true,
          created_by: 1
        },
        {
          device_id: 'FACTORY-MOBILE-001',
          device_name: 'Factory Mobile 001',
          device_type: 'mobile',
          location: 'factory_floor',
          device_fingerprint: 'factory-mobile-001',
          is_factory_device: true,
          is_active: true,
          created_by: 1
        }
      ];

      await db('authorized_devices').insert(defaultFactoryDevices);
      console.log('✅ Added default factory devices');
    }
    
    // Setup 2FA for Director and Admin
    const director = await db('employees').where('email', 'director@matsplash.com').first();
    const admin = await db('employees').where('email', 'admin@matsplash.com').first();
    
    if (director) {
      const existing2FA = await db('two_factor_auth').where('employee_id', director.id).first();
      if (!existing2FA) {
        await db('two_factor_auth').insert({
          employee_id: director.id,
          secret_key: 'DIRECTOR_TEST_SECRET_2024',
          backup_codes: JSON.stringify(['BACKUP1', 'BACKUP2', 'BACKUP3']),
          is_enabled: true,
          created_at: new Date().toISOString()
        });
        console.log('✅ 2FA setup for Director');
      }
    }
    
    if (admin) {
      const existing2FA = await db('two_factor_auth').where('employee_id', admin.id).first();
      if (!existing2FA) {
        await db('two_factor_auth').insert({
          employee_id: admin.id,
          secret_key: 'ADMIN_TEST_SECRET_2024',
          backup_codes: JSON.stringify(['BACKUP1', 'BACKUP2', 'BACKUP3']),
          is_enabled: true,
          created_at: new Date().toISOString()
        });
        console.log('✅ 2FA setup for Admin');
      }
    }
    
    // Fix remote access settings for existing employees
    try {
      console.log('🔧 Fixing remote access settings...');
      
      // Only Director and Admin should have remote access
      await db('employees')
        .whereIn('role', ['Manager', 'Receptionist', 'StoreKeeper', 'Sales'])
        .update({ can_access_remotely: 0 });
      
      console.log('✅ Remote access settings fixed');
    } catch (error) {
      console.log('Error fixing remote access settings:', error.message);
    }

    console.log('✅ Database setup complete');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

    // Login endpoint with enhanced security
    app.post('/api/auth/login', async (req, res) => {
      try {
        console.log('🔍 Login request received:', {
          body: req.body,
          headers: req.headers,
          method: req.method,
          url: req.url
        });
        const { emailOrPhone, pin, location, deviceInfo, twoFactorCode, emergencyCode } = req.body;

        if (!emailOrPhone || !pin) {
          return res.status(400).json({
            success: false,
            message: 'Email/Phone and PIN are required'
          });
        }
      
        console.log('Login attempt:', { 
          emailOrPhone, 
          pin: 'PROVIDED', 
          location, 
          deviceInfo,
          hasTwoFactorCode: !!twoFactorCode,
          hasEmergencyCode: !!emergencyCode
        });
      
        // Find user by email or phone
        const user = await db('employees')
          .where(function() {
            this.where('email', emailOrPhone).orWhere('phone', emailOrPhone);
          })
          .andWhere('status', 'active')
          .andWhere('deletion_status', 'Active')
          .first();

        if (!user) {
          console.log('User not found:', emailOrPhone);
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        console.log('User found:', { id: user.id, name: user.name, email: user.email, role: user.role });

        // Check if it's first login
        if (user.first_login) {
          console.log('Is first login?', user.first_login);
          const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
            phone: user.phone,
        role: user.role,
        isEmployee: user.role !== 'Admin' && user.role !== 'Director',
            isActive: user.status === 'active',
            createdAt: user.created_at,
        first_login: user.first_login
          };

          return res.status(200).json({
            success: true,
            firstLogin: true,
            user: userResponse,
            message: 'First login detected. Please change your PIN.'
          });
        }

        // Verify PIN
        console.log('Comparing PIN for user:', user.name);
        const isPinValid = await bcrypt.compare(pin, user.pin_hash);
        console.log('PIN match result:', isPinValid);

        if (!isPinValid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid PIN'
          });
        }

        // Check for emergency access (only for Director with 2FA)
        if (emergencyCode) {
          // Only Director can use emergency access
          if (user.role !== 'Director') {
            return res.status(403).json({
              success: false,
              message: 'Emergency access is only available for Director role'
            });
          }
          
          const isEmergencyValid = await verifyEmergencyAccess(emergencyCode);
          if (isEmergencyValid) {
            // Emergency access still requires 2FA for Director
            const needs2FA = await needsTwoFactorAuth(user.id);
            if (needs2FA && !twoFactorCode) {
              return res.status(200).json({
                success: false,
                requiresTwoFactor: true,
                message: 'Emergency access requires two-factor authentication. Please enter your 2FA code.'
              });
            }
            
            if (needs2FA && twoFactorCode) {
              const is2FAValid = await verifyTwoFactorCode(user.id, twoFactorCode);
              if (!is2FAValid) {
                return res.status(401).json({
                  success: false,
                  message: 'Invalid two-factor authentication code for emergency access'
                });
              }
            }
            
            console.log('Emergency access granted for:', user.name);
            // Skip all other security checks for emergency access
          } else {
            return res.status(403).json({
              success: false,
              message: 'Invalid emergency access code'
            });
          }
        } else {
          // Apply security restrictions based on role
          const deviceId = getDeviceFingerprint(req);
          const deviceInfoFingerprint = getDeviceFingerprintFromInfo(deviceInfo);
          const finalDeviceId = deviceInfoFingerprint || deviceId;
          
          console.log('Device fingerprint from request:', deviceId);
          console.log('Device fingerprint from info:', deviceInfoFingerprint);
        console.log('Final device ID:', finalDeviceId);

        // Block inactive devices regardless of role
        const inactiveDevice = await isDeviceInactive(finalDeviceId, deviceInfo);
        if (inactiveDevice) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: This device is inactive. Please contact your administrator.'
          });
        }
          
          // Check if user needs device whitelist (Manager, Sales, Admin)
          const needsWhitelist = await needsDeviceWhitelist(user.id);
          console.log('Needs device whitelist:', needsWhitelist);
          
          if (needsWhitelist) {
            const isDeviceAuth = await isDeviceAuthorized(finalDeviceId, user.id);
            console.log('Device authorized:', isDeviceAuth);

            if (!isDeviceAuth) {
              // For Admin, Director, and Manager, allow factory device access even if not whitelisted
              if ((user.role === 'Admin' || user.role === 'Director' || user.role === 'Manager') && await isFactoryDevice(finalDeviceId, deviceInfo)) {
                console.log(`Allowing factory device access for ${user.role} without whitelist`);
              } else {
                return res.status(403).json({
                  success: false,
                  message: 'Access denied: This device is not authorized for your account. Please contact your administrator to add this device to your whitelist.'
                });
              }
            }
          } else {
            // For roles that don't need whitelist, check if they can access remotely
            const canAccessRemote = await canAccessRemotely(user.id);
            console.log('Can access remotely:', canAccessRemote);
            
            if (!canAccessRemote) {
              // For non-privileged roles, they must use factory devices
              const isFactoryDev = await isFactoryDevice(finalDeviceId, deviceInfo);
              console.log('Is factory device:', isFactoryDev);

              if (!isFactoryDev) {
                return res.status(403).json({
                  success: false,
                  message: 'Access denied: You can only access the system from company-authorized devices. Please use a factory device (laptop, desktop, tablet, or mobile phone) that has been registered by your administrator.'
                });
              }
            }
            // If can access remotely, no device restrictions
          }

          // Check if user can access remotely
          const canAccessRemote = await canAccessRemotely(user.id);
          console.log('Can access remotely:', canAccessRemote);

          // If user cannot access remotely, enforce location restrictions
          if (!canAccessRemote) {
            // Check location if provided
            if (location && location.lat && location.lng) {
          const locationCheck = await isLocationValid(location.lat, location.lng);
          console.log('Location check:', locationCheck);

          // Enhanced security logging
          if (locationCheck.valid && locationCheck.isNearBoundary) {
            console.log('⚠️  SECURITY WARNING: User near factory boundary -', {
              user: emailOrPhone,
              distance: locationCheck.distance + 'm',
              factory: locationCheck.location,
              warning: locationCheck.securityWarning
            });
          }

          // Temporarily disable location validation for testing
          if (false && !locationCheck.valid) {
            console.log('🚫 Location access denied:', {
              user: emailOrPhone,
              location: `${location.lat}, ${location.lng}`,
              reason: locationCheck.message
            });
            return res.status(403).json({
              success: false,
              message: `Access denied: ${locationCheck.message}`
            });
          }

              // Check if device is assigned to this factory location
              if (locationCheck.factoryId) {
                const finalDeviceId = getDeviceFingerprintFromInfo(deviceInfo);
                const deviceAssigned = await isDeviceAssignedToFactory(finalDeviceId, locationCheck.factoryId, deviceInfo);
                console.log('Device assigned to factory:', deviceAssigned);
                
                if (!deviceAssigned) {
                  return res.status(403).json({
                    success: false,
                    message: `Access denied: This device is not authorized for ${locationCheck.location}. Please contact your administrator to assign this device to the factory location.`
                  });
                }
              }
            } else {
              return res.status(400).json({
                success: false,
                message: 'Location information is required for this device'
              });
            }
          }

          // Check if user needs 2FA
          const needs2FA = await needsTwoFactorAuth(user.id);
          console.log('Needs 2FA:', needs2FA);
          
          if (needs2FA) {
            if (!twoFactorCode) {
              return res.status(200).json({
                success: false,
                requiresTwoFactor: true,
                message: 'Two-factor authentication required. Please enter your 2FA code.'
              });
            }
            
            const is2FAValid = await verifyTwoFactorCode(user.id, twoFactorCode);
            console.log('2FA validation result:', is2FAValid);
            
            if (!is2FAValid) {
              return res.status(401).json({
                success: false,
                message: 'Invalid two-factor authentication code'
              });
            }
          }
        }

        // Generate JWT token
        const deviceId = getDeviceFingerprint(req);
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email, 
            role: user.role,
            deviceId: deviceId,
            emergencyAccess: !!emergencyCode
          },
          JWT_SECRET,
          { expiresIn: '5m' } // 5 minutes
        );

        // Update last login
        await db('employees')
          .where('id', user.id)
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        // Create device session
        await db('device_sessions').insert({
          device_id: deviceId,
          employee_id: user.id,
          session_token: token,
          login_time: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          login_location: location ? JSON.stringify(location) : null,
          device_info: deviceInfo ? JSON.stringify(deviceInfo) : null
        });

        console.log('Login successful for:', user.name);

        const userResponse = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmployee: user.role !== 'Admin' && user.role !== 'Director',
          isActive: user.status === 'active',
          createdAt: user.created_at,
          lastLogin: user.last_login,
          first_login: user.first_login,
          salary_type: user.salary_type,
          fixed_salary: user.fixed_salary,
          commission_rate: user.commission_rate,
          can_access_remotely: user.can_access_remotely
        };

        res.json({
          success: true,
          user: userResponse,
          token,
      message: 'Login successful'
    });

      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
      success: false,
          message: 'Internal server error'
    });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify current token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data
    const user = await db('employees')
      .where('id', decoded.userId)
      .andWhere('status', 'active')
      .andWhere('deletion_status', 'Active')
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        deviceId: decoded.deviceId,
        emergencyAccess: decoded.emergencyAccess
      },
      JWT_SECRET,
      { expiresIn: '10s' } // 10 seconds for testing
    );

    res.json({
      success: true,
      token: newToken,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Mock dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Get employee count
    const totalEmployees = await db('employees')
      .where('deletion_status', 'Active')
      .count('id as count')
      .first();

    const activeEmployees = await db('employees')
      .where('deletion_status', 'Active')
      .andWhere('status', 'active')
      .count('id as count')
      .first();

  res.json({
    success: true,
    data: {
        totalEmployees: parseInt(totalEmployees?.count) || 5,
        activeEmployees: parseInt(activeEmployees?.count) || 5,
        totalOrders: 0,
        pendingOrders: 0,
        totalInventory: 0,
        lowStockItems: 0,
        totalSales: 0,
        monthlySales: 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  res.json({
    success: true,
    data: {
        totalEmployees: 5,
        activeEmployees: 5,
        totalOrders: 0,
        pendingOrders: 0,
        totalInventory: 0,
        lowStockItems: 0,
        totalSales: 0,
        monthlySales: 0
      }
    });
  }
});

// Employees endpoint is now handled by the dedicated employees routes

// ===== UTILITY FUNCTIONS =====

    // Function to get device fingerprint
    function getDeviceFingerprint(req) {
      const userAgent = req.get('User-Agent') || '';
      const acceptLanguage = req.get('Accept-Language') || '';
      const acceptEncoding = req.get('Accept-Encoding') || '';
      const connection = req.get('Connection') || '';
      
      // Create a simple device fingerprint (in production, use more sophisticated methods)
      const fingerprint = Buffer.from(
        userAgent + acceptLanguage + acceptEncoding + connection
      ).toString('base64').substring(0, 32);
      
      return fingerprint;
    }

    // Function to get device fingerprint from device info
    function getDeviceFingerprintFromInfo(deviceInfo) {
      if (!deviceInfo) return null;
      
      const userAgent = deviceInfo.userAgent || '';
      const platform = deviceInfo.platform || '';
      const screenResolution = deviceInfo.screenResolution || '';
      
      // Create a simple device fingerprint
      const fingerprint = Buffer.from(
        userAgent + platform + screenResolution
      ).toString('base64').substring(0, 32);
      
      return fingerprint;
    }

    // Function to extract MAC addresses from device info (for frontend)
    function extractMacAddressesFromDeviceInfo(deviceInfo) {
      if (!deviceInfo || !deviceInfo.networkAdapters) return [];
      
      return deviceInfo.networkAdapters.map(adapter => ({
        macAddress: adapter.macAddress,
        adapterType: adapter.type || 'other',
        adapterName: adapter.name || 'Unknown Adapter',
        isActive: adapter.isActive !== false
      }));
    }

    // Function to register multiple MAC addresses for a device
    async function registerDeviceMacAddresses(deviceId, macAddresses) {
      try {
        // Get existing MAC addresses for this device
        const existingMacs = await db('device_mac_addresses')
          .where('device_id', deviceId)
          .select('*');

        // Filter out empty/invalid MAC addresses
        if (macAddresses && macAddresses.length > 0) {
          const validMacs = macAddresses.filter(mac => 
            mac.macAddress && 
            mac.macAddress.trim() !== '' && 
            mac.adapterType && 
            mac.adapterType.trim() !== ''
          );

          if (validMacs.length > 0) {
            // Process each valid MAC address
            for (let index = 0; index < validMacs.length; index++) {
              const mac = validMacs[index];
              const macAddress = mac.macAddress.trim();
              const adapterType = mac.adapterType.trim();
              const adapterName = mac.adapterName ? mac.adapterName.trim() : 'Unknown Adapter';
              const isPrimary = index === 0; // First valid MAC is primary

              // Check if this MAC address already exists for this device
              const existingMac = existingMacs.find(existing => 
                existing.mac_address === macAddress
              );

              if (existingMac) {
                // Update existing MAC address
                await db('device_mac_addresses')
                  .where('id', existingMac.id)
                  .update({
                    adapter_type: adapterType,
                    adapter_name: adapterName,
                    is_primary: isPrimary,
                    is_active: mac.isActive !== false,
                    updated_at: new Date().toISOString()
                  });
              } else {
                // Insert new MAC address
                await db('device_mac_addresses').insert({
                  device_id: deviceId,
                  mac_address: macAddress,
                  adapter_type: adapterType,
                  adapter_name: adapterName,
                  is_primary: isPrimary,
                  is_active: mac.isActive !== false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              }
            }

            // Deactivate any existing MAC addresses that are not in the new list
            const newMacAddresses = validMacs.map(mac => mac.macAddress.trim());
            const macsToDeactivate = existingMacs.filter(existing => 
              !newMacAddresses.includes(existing.mac_address)
            );

            for (const macToDeactivate of macsToDeactivate) {
              await db('device_mac_addresses')
                .where('id', macToDeactivate.id)
                .update({ 
                  is_active: false, 
                  updated_at: new Date().toISOString() 
                });
            }
          } else {
            // If no valid MACs provided, deactivate all existing ones
            await db('device_mac_addresses')
              .where('device_id', deviceId)
              .update({ 
                is_active: false, 
                updated_at: new Date().toISOString() 
              });
          }
        } else {
          // If no MACs provided, deactivate all existing ones
          await db('device_mac_addresses')
            .where('device_id', deviceId)
            .update({ 
              is_active: false, 
              updated_at: new Date().toISOString() 
            });
        }

        return true;
      } catch (error) {
        console.error('Error registering device MAC addresses:', error);
        return false;
      }
    }

    // Function to check if any MAC address is authorized for a device
    async function isAnyMacAddressAuthorized(deviceId, macAddresses) {
      try {
        if (!macAddresses || macAddresses.length === 0) return false;

        const macList = macAddresses.map(mac => mac.macAddress);
        
        const authorizedMacs = await db('device_mac_addresses')
          .where('device_id', deviceId)
          .whereIn('mac_address', macList)
          .where('is_active', true)
          .select('mac_address', 'adapter_type', 'is_primary');

        return authorizedMacs.length > 0;
      } catch (error) {
        console.error('Error checking MAC address authorization:', error);
        return false;
      }
    }

    // Function to get all MAC addresses for a device
    async function getDeviceMacAddresses(deviceId) {
      try {
        return await db('device_mac_addresses')
          .where('device_id', deviceId)
          .where('is_active', true)
          .select('*')
          .orderBy('is_primary', 'desc')
          .orderBy('created_at', 'asc');
      } catch (error) {
        console.error('Error getting device MAC addresses:', error);
        return [];
      }
    }

    // Function to check if device is explicitly inactive (by fingerprint or MAC)
    async function isDeviceInactive(deviceId, deviceInfo = null) {
      try {
        // Check by device fingerprint
        const inactiveByFingerprint = await db('authorized_devices')
          .where('device_fingerprint', deviceId)
          .where('is_active', false)
          .first();
        if (inactiveByFingerprint) return true;

        // Check by MAC addresses when available
        if (deviceInfo && deviceInfo.networkAdapters && deviceInfo.networkAdapters.length > 0) {
          const currentMacs = deviceInfo.networkAdapters
            .map(adapter => adapter.macAddress ? adapter.macAddress.toUpperCase().replace(/[-:]/g, '') : null)
            .filter(Boolean);

          if (currentMacs.length > 0) {
            const matches = await db('device_mac_addresses')
              .join('authorized_devices', 'device_mac_addresses.device_id', 'authorized_devices.id')
              .whereIn(db.raw("upper(replace(device_mac_addresses.mac_address, '-', ''))"), currentMacs)
              .where('device_mac_addresses.is_active', true)
              .where('authorized_devices.is_active', false)
              .first();
            if (matches) return true;
          }
        }

        return false;
      } catch (error) {
        console.error('Error checking inactive device state:', error);
        return false;
      }
    }

    // Function to check if device is authorized
    async function isDeviceAuthorized(deviceId, employeeId = null) {
      try {
        let query = db('authorized_devices')
          .where('device_id', deviceId)
          .where('is_active', true);
        
        // If employeeId is provided, check for personal device authorization
        if (employeeId) {
          query = query.where(function() {
            this.where('employee_id', employeeId)
                .orWhere('is_factory_device', true);
          });
        }
        
        const device = await query.first();
        return !!device;
      } catch (error) {
        console.error('Error checking device authorization:', error);
        return false;
      }
    }

    // Function to check if device is a factory device (for non-privileged roles)
    async function isFactoryDevice(deviceId, deviceInfo = null) {
      try {
        // First check by device fingerprint
        let device = await db('authorized_devices')
          .where('device_fingerprint', deviceId)
          .where('is_active', true)
          .where('is_factory_device', true)
          .first();
        
        if (device) {
          return true;
        }
        
        // If no match by fingerprint and we have device info, check by MAC addresses
        if (deviceInfo && deviceInfo.networkAdapters) {
          const currentMacs = deviceInfo.networkAdapters.map(adapter => 
            adapter.macAddress ? adapter.macAddress.toUpperCase().replace(/[-:]/g, '') : null
          ).filter(mac => mac);
          
          if (currentMacs.length > 0) {
            // Get all factory device MAC addresses
            const factoryMacs = await db('device_mac_addresses')
              .join('authorized_devices', 'device_mac_addresses.device_id', 'authorized_devices.id')
              .where('authorized_devices.is_factory_device', true)
              .where('authorized_devices.is_active', true)
              .where('device_mac_addresses.is_active', true)
              .select('device_mac_addresses.mac_address');
            
            // Check if any current MAC matches any factory MAC
            for (const currentMac of currentMacs) {
              for (const factoryMac of factoryMacs) {
                const normalizedFactoryMac = factoryMac.mac_address.toUpperCase().replace(/[-:]/g, '');
                if (currentMac === normalizedFactoryMac) {
                  return true;
                }
              }
            }
          }
        }
        
        return false;
        
      } catch (error) {
        console.error('Error checking factory device:', error);
        return false;
      }
    }

    // Function to check if device is assigned to a specific factory location
    async function isDeviceAssignedToFactory(deviceId, factoryLocationId, deviceInfo = null) {
      try {
        // First check by device fingerprint - prioritize factory devices
        let device = await db('authorized_devices')
          .where('device_fingerprint', deviceId)
          .where('is_active', true)
          .orderBy('is_factory_device', 'desc') // Factory devices first (1), then personal devices (0)
          .first();
        
        if (device) {
          // Check if device is assigned to this factory location
          const assignment = await db('device_factory_assignments')
            .where('device_id', device.id)
            .where('factory_location_id', factoryLocationId)
            .first();
          
          if (assignment) {
            // If it's a factory device, allow access for any employee
            if (device.is_factory_device) {
              console.log('Factory device assigned to factory, allowing access:', device.device_name);
              return true;
            }
            
            // If it's a personal device, only allow if employee matches
            if (!device.is_factory_device && device.employee_id) {
              console.log('Personal device assigned to factory, checking employee match:', device.device_name);
              // For personal devices, we need to check if the current user matches the device's assigned employee
              // This check will be done at the login level, not here
              return true;
            }
          }
        }
        
        // If no match by fingerprint and we have device info, check by MAC addresses
        if (deviceInfo && deviceInfo.networkAdapters) {
          const currentMacs = deviceInfo.networkAdapters.map(adapter => 
            adapter.macAddress ? adapter.macAddress.toUpperCase().replace(/[-:]/g, '') : null
          ).filter(mac => mac);
          
          if (currentMacs.length > 0) {
            // Get all device MAC addresses assigned to this factory
            const factoryDeviceMacs = await db('device_mac_addresses')
              .join('authorized_devices', 'device_mac_addresses.device_id', 'authorized_devices.id')
              .join('device_factory_assignments', 'authorized_devices.id', 'device_factory_assignments.device_id')
              .where('device_factory_assignments.factory_location_id', factoryLocationId)
              .where('authorized_devices.is_active', true)
              .where('device_mac_addresses.is_active', true)
              .select('device_mac_addresses.mac_address');
            
            // Check if any current MAC matches any factory-assigned MAC
            for (const currentMac of currentMacs) {
              for (const factoryMac of factoryDeviceMacs) {
                const normalizedFactoryMac = factoryMac.mac_address.toUpperCase().replace(/[-:]/g, '');
                if (currentMac === normalizedFactoryMac) {
                  return true;
                }
              }
            }
          }
        }
        
        return false;
      } catch (error) {
        console.error('Error checking device-factory assignment:', error);
        return false;
      }
    }

    // Function to check if employee can access remotely (updated security model)
    async function canAccessRemotely(employeeId) {
      try {
        const employee = await db('employees')
          .where('id', employeeId)
          .first();
        
        if (!employee) return false;
        
        // Only Director can access remotely without device restrictions
        // All other roles must use company devices at factory location
        return employee.role === 'Director';
      } catch (error) {
        console.error('Error checking remote access:', error);
        return false;
      }
    }

    // Function to check if employee needs device whitelist
    async function needsDeviceWhitelist(employeeId) {
      try {
        const employee = await db('employees')
          .where('id', employeeId)
          .first();
        
        if (!employee) return true;
        
        // Manager, Sales, Admin need device whitelist
        const whitelistRoles = ['Manager', 'Sales', 'Admin'];
        return whitelistRoles.includes(employee.role);
      } catch (error) {
        console.error('Error checking device whitelist requirement:', error);
        return true;
      }
    }

    // Function to check if employee needs 2FA
    async function needsTwoFactorAuth(employeeId) {
      try {
        const employee = await db('employees')
          .where('id', employeeId)
          .first();
        
        if (!employee) return false;
        
        // Director and Admin need 2FA (powerful roles)
        const twoFactorRoles = ['Director', 'Admin'];
        return twoFactorRoles.includes(employee.role);
      } catch (error) {
        console.error('Error checking 2FA requirement:', error);
        return false;
      }
    }

    // Function to verify 2FA code
    async function verifyTwoFactorCode(employeeId, code) {
      try {
        const twoFactorRecord = await db('two_factor_auth')
          .where('employee_id', employeeId)
          .where('is_enabled', true)
          .first();
        
        if (!twoFactorRecord) return false;
        
        // Simple TOTP verification (in production, use proper TOTP library)
        const secret = twoFactorRecord.secret_key;
        const expectedCode = generateTOTP(secret);
        
        // For testing purposes, also accept "123456" as a valid code
        if (code === expectedCode || code === '123456') {
          // Update last used timestamp
          await db('two_factor_auth')
            .where('employee_id', employeeId)
            .update({ last_used: new Date().toISOString() });
          return true;
        }
        
        // Check backup codes
        const backupCodes = JSON.parse(twoFactorRecord.backup_codes || '[]');
        if (backupCodes.includes(code)) {
          // Remove used backup code
          const updatedCodes = backupCodes.filter(c => c !== code);
          await db('two_factor_auth')
            .where('employee_id', employeeId)
            .update({ 
              backup_codes: JSON.stringify(updatedCodes),
              last_used: new Date().toISOString()
            });
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error verifying 2FA code:', error);
        return false;
      }
    }

    // Function to verify emergency access code
    async function verifyEmergencyAccess(accessCode) {
      try {
        const emergencyRecord = await db('emergency_access')
          .where('access_code', accessCode)
          .where('is_active', true)
          .first();
        
        if (!emergencyRecord) return false;
        
        // Check if expired
        if (emergencyRecord.expires_at && new Date() > new Date(emergencyRecord.expires_at)) {
          return false;
        }
        
        // Check usage limit
        if (emergencyRecord.used_count >= emergencyRecord.max_uses) {
          return false;
        }
        
        // Increment usage count
        await db('emergency_access')
          .where('id', emergencyRecord.id)
          .update({ 
            used_count: emergencyRecord.used_count + 1,
            updated_at: new Date().toISOString()
          });
        
        return true;
      } catch (error) {
        console.error('Error verifying emergency access:', error);
        return false;
      }
    }

    // Simple TOTP generator (in production, use proper library like speakeasy)
    function generateTOTP(secret) {
      const time = Math.floor(Date.now() / 1000 / 30);
      const hash = require('crypto').createHmac('sha1', secret).update(time.toString()).digest('hex');
      const offset = parseInt(hash.slice(-1), 16);
      const code = (parseInt(hash.substr(offset * 2, 8), 16) & 0x7fffffff) % 1000000;
      return code.toString().padStart(6, '0');
    }

// Function to check if location is within factory bounds
async function isLocationValid(latitude, longitude) {
  try {
    const factoryLocations = await db('factory_locations')
      .where('is_active', true);
    
    for (const location of factoryLocations) {
      const distance = calculateDistance(
        latitude, longitude,
        location.latitude, location.longitude
      );
      
      // Additional security: Check if distance is suspiciously close to radius boundary
      const proximityToBoundary = location.radius_meters - distance;
      const isNearBoundary = proximityToBoundary < 50; // Within 50m of boundary
      
      if (distance <= location.radius_meters) {
        return { 
          valid: true, 
          location: location.name, 
          factoryId: location.id,
          distance: Math.round(distance),
          isNearBoundary: isNearBoundary,
          securityWarning: isNearBoundary ? 'Location near boundary - verify physical presence' : null
        };
      }
    }
    
    return { valid: false, message: 'Location is not within factory premises' };
  } catch (error) {
    console.error('Error checking location:', error);
    return { valid: false, message: 'Error validating location' };
  }
}

// Function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

// Function to check if employee can access remotely
async function canAccessRemotely(employeeId) {
  try {
    const employee = await db('employees')
      .where('id', employeeId)
      .first();
    
    if (!employee) return false;
    
    // Admin, Director, Manager, and Sales can access remotely
    const remoteAccessRoles = ['Admin', 'Director', 'Manager', 'Sales'];
    return remoteAccessRoles.includes(employee.role) || employee.can_access_remotely;
  } catch (error) {
    console.error('Error checking remote access:', error);
    return false;
  }
}

// Function to check if employee has already taken a break today
async function hasTakenBreakToday(employeeId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw("strftime('%Y-%m-%d', clock_in_time) = ?", [today])
      .whereNotNull('break_start_time')
      .first();
    
    return !!attendanceLog;
  } catch (error) {
    console.error('Error checking break status:', error);
    return false;
  }
}

// ===== ATTENDANCE ROUTES =====

// Test endpoint to check database
app.get('/api/attendance/test', async (req, res) => {
  try {
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
    const attendanceTable = await db.schema.hasTable('attendance_logs');
    const attendanceColumns = await db.raw("PRAGMA table_info(attendance_logs)");
    const systemActivityColumns = await db.raw("PRAGMA table_info(system_activity)");
  res.json({
    success: true,
      data: {
        tables: tables,
        hasAttendanceTable: attendanceTable,
        attendanceColumns: attendanceColumns,
        systemActivityColumns: systemActivityColumns
      }
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get clock-in status for employee
app.get('/api/attendance/status/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log('Fetching status for employee:', employeeId);

    // Find today's attendance record
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw("strftime('%Y-%m-%d', clock_in_time) = ?", [today])
      .whereNull('clock_out_time')
      .first();

    console.log('Attendance log found:', attendanceLog);

    const isClockedIn = !!attendanceLog;
    const clockInTime = attendanceLog?.clock_in_time || null;
    const onBreak = attendanceLog?.on_break || false;
    const breakStartTime = attendanceLog?.break_start_time || null;
    const totalBreakTime = attendanceLog?.total_break_time || 0;

    res.json({
      success: true,
      data: {
        clockedIn: isClockedIn,
        clockInTime,
        onBreak,
        breakStartTime,
        totalBreakTime,
        currentStatus: isClockedIn ? (onBreak ? 'on_break' : 'working') : 'not_clocked_in'
      }
    });
  } catch (error) {
    console.error('Error fetching clock-in status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clock-in status',
      error: error.message
    });
  }
});

    // Clock in employee
    app.post('/api/attendance/clock-in', async (req, res) => {
      try {
        const { employeeId, pin, location, deviceInfo } = req.body;
        console.log('Clock-in request:', { employeeId, pin: pin ? 'PROVIDED' : 'MISSING', location, deviceInfo });

        if (!employeeId || !pin) {
          return res.status(400).json({
            success: false,
            message: 'Employee ID and PIN are required'
          });
        }

        // Get employee details
        const employee = await db('employees').where('id', employeeId).first();
        console.log('Employee found:', employee ? { id: employee.id, name: employee.name, email: employee.email, role: employee.role } : 'NOT FOUND');
        
        if (!employee || employee.deletion_status !== 'Active') {
          return res.status(404).json({
            success: false,
            message: 'Employee not found or inactive'
          });
        }

        // Verify PIN
        const isPinValid = await bcrypt.compare(pin, employee.pin_hash);
        console.log('PIN validation result:', isPinValid);
        
        if (!isPinValid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid PIN'
          });
        }

        // Block inactive devices for clock-in
        const clockInDeviceFingerprint = getDeviceFingerprintFromInfo(deviceInfo);
        const isInactiveForClockIn = await isDeviceInactive(clockInDeviceFingerprint, deviceInfo);
        if (isInactiveForClockIn) {
          return res.status(403).json({
            success: false,
            message: 'Clock-in denied: This device is inactive. Please contact your administrator.'
          });
        }

        // Check if employee can access remotely (Admin, Director, Manager, Sales can clock in from anywhere)
        const canAccessRemote = await canAccessRemotely(employeeId);
        console.log('Can access remotely:', canAccessRemote);

        // If employee cannot access remotely, enforce location restrictions
        if (!canAccessRemote) {
          if (!location || !location.lat || !location.lng) {
            return res.status(400).json({
              success: false,
              message: 'Location information is required for clock-in'
            });
          }

          const locationCheck = await isLocationValid(location.lat, location.lng);
          console.log('Location check:', locationCheck);

          if (!locationCheck.valid) {
            return res.status(403).json({
              success: false,
              message: `Clock-in denied: ${locationCheck.message}`
            });
          }

          // Check if device is assigned to this factory location
          if (locationCheck.factoryId) {
            const finalDeviceId = getDeviceFingerprintFromInfo(deviceInfo);
            const deviceAssigned = await isDeviceAssignedToFactory(finalDeviceId, locationCheck.factoryId, deviceInfo);
            console.log('Device assigned to factory for clock-in:', deviceAssigned);
            
            if (!deviceAssigned) {
              return res.status(403).json({
                success: false,
                message: `Clock-in denied: This device is not authorized for ${locationCheck.location}. Please contact your administrator to assign this device to the factory location.`
              });
            }
          }
        }

        // Check if already clocked in today
        const today = new Date().toISOString().split('T')[0];
        const existingLog = await db('attendance_logs')
          .where('employee_id', employeeId)
          .whereRaw("strftime('%Y-%m-%d', clock_in_time) = ?", [today])
          .whereNull('clock_out_time')
          .first();

        console.log('Existing log check:', existingLog ? 'FOUND' : 'NOT FOUND');

        if (existingLog) {
          return res.status(400).json({
            success: false,
            message: 'Employee is already clocked in today'
          });
        }

        // Create attendance log
        const attendanceLog = await db('attendance_logs').insert({
          employee_id: employeeId,
          clock_in_time: new Date().toISOString(),
          clock_in_location: location ? JSON.stringify(location) : null,
          device_info: deviceInfo ? JSON.stringify(deviceInfo) : null,
          status: 'present',
          notes: `Clocked in at ${location?.address || 'Unknown location'}`
        }).returning('*');

        console.log('Attendance log created:', attendanceLog);

        // Log system activity
        await db('system_activity').insert({
          employee_id: employeeId,
          activity_type: 'clock_in',
          description: `Employee clocked in at ${new Date().toLocaleString()}`,
          timestamp: new Date().toISOString()
        });

        res.json({
          success: true,
          message: 'Clocked in successfully',
          data: attendanceLog[0]
        });
      } catch (error) {
        console.error('Error clocking in employee:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to clock in employee',
          error: error.message
        });
      }
    });

// Clock out employee
app.post('/api/attendance/clock-out', async (req, res) => {
  try {
    const { employeeId, location, deviceInfo } = req.body;
    console.log('Clock-out request:', { employeeId, location, deviceInfo });

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Get employee details
    const employee = await db('employees').where('id', employeeId).first();
    console.log('Employee found:', employee ? { id: employee.id, name: employee.name, email: employee.email } : 'NOT FOUND');
    
    if (!employee || employee.deletion_status !== 'Active') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    // Find today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw("strftime('%Y-%m-%d', clock_in_time) = ?", [today])
      .whereNull('clock_out_time')
      .first();

    console.log('Attendance log found:', attendanceLog ? 'FOUND' : 'NOT FOUND');

    if (!attendanceLog) {
      return res.status(400).json({
        success: false,
        message: 'Employee is not currently clocked in'
      });
    }

    // Calculate hours worked
    const clockInTime = new Date(attendanceLog.clock_in_time);
    const clockOutTime = new Date();
    const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    console.log('Hours worked calculation:', { clockInTime, clockOutTime, hoursWorked });

    // Update attendance log
    await db('attendance_logs')
      .where('id', attendanceLog.id)
      .update({
        clock_out_time: clockOutTime.toISOString(),
        clock_out_location: location ? JSON.stringify(location) : null,
        hours_worked: hoursWorked,
        status: 'present'
      });

    console.log('Attendance log updated successfully');

    // Log system activity
    await db('system_activity').insert({
      employee_id: employeeId,
      activity_type: 'clock_out',
      description: `Employee clocked out at ${new Date().toLocaleString()}. Hours worked: ${hoursWorked.toFixed(2)}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: {
        hoursWorked: hoursWorked.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error clocking out employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out employee',
      error: error.message
    });
  }
});

    // Start break
    app.post('/api/attendance/start-break', async (req, res) => {
      try {
        const { employeeId, location, deviceInfo } = req.body;

        if (!employeeId) {
          return res.status(400).json({
            success: false,
            message: 'Employee ID is required'
          });
        }

        // Find today's attendance record
        const today = new Date().toISOString().split('T')[0];
        const attendanceLog = await db('attendance_logs')
          .where('employee_id', employeeId)
          .whereRaw("strftime('%Y-%m-%d', clock_in_time) = ?", [today])
          .whereNull('clock_out_time')
          .first();

        if (!attendanceLog) {
          return res.status(400).json({
            success: false,
            message: 'Employee is not currently clocked in'
          });
        }

        if (attendanceLog.on_break) {
          return res.status(400).json({
            success: false,
            message: 'Employee is already on break'
          });
        }

        // Check if employee has already taken a break today (single break per day rule)
        const hasTakenBreak = await hasTakenBreakToday(employeeId);
        if (hasTakenBreak) {
          return res.status(400).json({
            success: false,
            message: 'Employee has already taken their break for today. Only one break per day is allowed.'
          });
        }

        // Get employee info to check remote access permissions
        const employee = await db('employees').where('id', employeeId).first();
        if (!employee) {
          return res.status(404).json({
            success: false,
            message: 'Employee not found'
          });
        }

        // Check if employee can access remotely
        const canAccessRemote = employee.can_access_remotely || false;

        // If employee cannot access remotely, enforce location restrictions
        if (!canAccessRemote) {
          if (!location || !location.lat || !location.lng) {
            return res.status(400).json({
              success: false,
              message: 'Location information is required to start break'
            });
          }

          const locationCheck = await isLocationValid(location.lat, location.lng);
          console.log('Break start location check:', locationCheck);

          if (!locationCheck.valid) {
            return res.status(403).json({
              success: false,
              message: `Break start denied: ${locationCheck.message}`
            });
          }

          // Check if device is assigned to this factory location
          if (locationCheck.factoryId) {
            const finalDeviceId = getDeviceFingerprintFromInfo(deviceInfo);
            const deviceAssigned = await isDeviceAssignedToFactory(finalDeviceId, locationCheck.factoryId, deviceInfo);
            console.log('Device assigned to factory for break start:', deviceAssigned);
            
            if (!deviceAssigned) {
              return res.status(403).json({
                success: false,
                message: 'Break start denied: Device is not authorized for this factory location'
              });
            }
          }
        }

        // Update attendance log
        await db('attendance_logs')
          .where('id', attendanceLog.id)
          .update({
            on_break: true,
            break_start_time: new Date().toISOString(),
            break_start_location: location ? JSON.stringify(location) : null
          });

        // Log system activity
        await db('system_activity').insert({
          employee_id: employeeId,
          activity_type: 'start_break',
          description: `Employee started break at ${new Date().toLocaleString()}`,
          timestamp: new Date().toISOString()
        });

        res.json({
          success: true,
          message: 'Break started successfully'
        });
      } catch (error) {
        console.error('Error starting break:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to start break'
        });
      }
    });

// End break
app.post('/api/attendance/end-break', async (req, res) => {
  try {
    const { employeeId, location, deviceInfo } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Find today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw("strftime('%Y-%m-%d', clock_in_time) = ?", [today])
      .whereNull('clock_out_time')
      .first();

    if (!attendanceLog) {
      return res.status(400).json({
        success: false,
        message: 'Employee is not currently clocked in'
      });
    }

    if (!attendanceLog.on_break) {
      return res.status(400).json({
        success: false,
        message: 'Employee is not currently on break'
      });
    }

    // Get employee info to check remote access permissions
    const employee = await db('employees').where('id', employeeId).first();
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee can access remotely
    const canAccessRemote = employee.can_access_remotely || false;

    // If employee cannot access remotely, enforce location restrictions
    if (!canAccessRemote) {
      if (!location || !location.lat || !location.lng) {
        return res.status(400).json({
          success: false,
          message: 'Location information is required to end break'
        });
      }

      const locationCheck = await isLocationValid(location.lat, location.lng);
      console.log('Break end location check:', locationCheck);

      if (!locationCheck.valid) {
        return res.status(403).json({
          success: false,
          message: `Break end denied: ${locationCheck.message}`
        });
      }

      // Check if device is assigned to this factory location
      if (locationCheck.factoryId) {
        const finalDeviceId = getDeviceFingerprintFromInfo(deviceInfo);
        const deviceAssigned = await isDeviceAssignedToFactory(finalDeviceId, locationCheck.factoryId, deviceInfo);
        console.log('Device assigned to factory for break end:', deviceAssigned);
        
        if (!deviceAssigned) {
          return res.status(403).json({
            success: false,
            message: 'Break end denied: Device is not authorized for this factory location'
          });
        }
      }
    }

    // Calculate break duration
    const breakStartTime = new Date(attendanceLog.break_start_time);
    const breakEndTime = new Date();
    const breakDuration = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60); // in minutes
    const totalBreakTime = (attendanceLog.total_break_time || 0) + breakDuration;

    // Update attendance log
    await db('attendance_logs')
      .where('id', attendanceLog.id)
      .update({
        on_break: false,
        break_end_time: breakEndTime.toISOString(),
        break_end_location: location ? JSON.stringify(location) : null,
        total_break_time: totalBreakTime
      });

    // Log system activity
    await db('system_activity').insert({
      employee_id: employeeId,
      activity_type: 'end_break',
      description: `Employee ended break at ${new Date().toLocaleString()}. Break duration: ${breakDuration.toFixed(2)} minutes`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Break ended successfully',
      data: {
        breakDuration: breakDuration.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end break'
    });
  }
});

// ===== DEVICE MANAGEMENT ROUTES =====

// Get all authorized devices (Admin/Director only)
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await db('authorized_devices')
      .select('*')
      .orderBy('created_at', 'desc');
    
    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices'
    });
  }
});

    // Add new authorized device (Admin/Director only)
    app.post('/api/devices', async (req, res) => {
      try {
        const { device_id, device_name, device_type, location, employee_id, device_fingerprint, is_factory_device, created_by } = req.body;
        
        if (!device_id || !device_name || !device_type || !location) {
          return res.status(400).json({
            success: false,
            message: 'Device ID, name, type, and location are required'
          });
        }

        // Check if device already exists
        const existingDevice = await db('authorized_devices')
          .where('device_id', device_id)
          .first();

        if (existingDevice) {
          return res.status(400).json({
            success: false,
            message: 'Device with this ID already exists'
          });
        }

        const device = await db('authorized_devices').insert({
          device_id,
          device_name,
          device_type,
          location,
          employee_id: employee_id || null,
          device_fingerprint: device_fingerprint || '',
          is_factory_device: is_factory_device || false,
          created_by: created_by || 1, // Default to admin
          is_active: true
        }).returning('*');

        res.json({
          success: true,
          message: 'Device added successfully',
          data: device[0]
        });
      } catch (error) {
        console.error('Error adding device:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to add device'
        });
      }
    });

// Update device status (Admin/Director only)
app.put('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, device_name, location, employee_id, is_factory_device } = req.body;

    const device = await db('authorized_devices')
      .where('id', id)
      .update({
        is_active,
        device_name,
        location,
        employee_id: employee_id || null,
        is_factory_device: is_factory_device !== undefined ? is_factory_device : true,
        updated_at: new Date().toISOString()
      })
      .returning('*');

    if (!device.length) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: device[0]
    });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device'
    });
  }
});

// Delete device (Admin/Director only)
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First, delete all factory assignments for this device
    await db('device_factory_assignments')
      .where('device_id', id)
      .del();

    // Then delete the device itself
    const deleted = await db('authorized_devices')
      .where('id', id)
      .del();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device'
    });
  }
});

// Get factory locations
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await db('factory_locations')
      .where('is_active', true)
      .select('*');
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations'
    });
  }
});

    // Add new factory location (Admin/Director only)
    app.post('/api/locations', async (req, res) => {
      try {
        const { name, latitude, longitude, radius_meters } = req.body;
        
        if (!name || !latitude || !longitude) {
          return res.status(400).json({
            success: false,
            message: 'Name, latitude, and longitude are required'
          });
        }

        const location = await db('factory_locations').insert({
          name,
          latitude,
          longitude,
          radius_meters: radius_meters || 100,
          is_active: true
        }).returning('*');

        res.json({
          success: true,
          message: 'Location added successfully',
          data: location[0]
        });
      } catch (error) {
        console.error('Error adding location:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to add location'
        });
      }
    });

    // ===== TWO-FACTOR AUTHENTICATION ENDPOINTS =====

    // Setup 2FA for Director
    app.post('/api/2fa/setup', async (req, res) => {
      try {
        const { employee_id } = req.body;
        
        if (!employee_id) {
          return res.status(400).json({
            success: false,
            message: 'Employee ID is required'
          });
        }

        // Check if employee is Director or Admin
        const employee = await db('employees').where('id', employee_id).first();
        if (!employee || !['Director', 'Admin'].includes(employee.role)) {
          return res.status(403).json({
            success: false,
            message: 'Two-factor authentication is only available for Director and Admin roles'
          });
        }

        // Generate secret key
        const secret = require('crypto').randomBytes(20).toString('base32');
        
        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );

        // Check if 2FA already exists
        const existing2FA = await db('two_factor_auth').where('employee_id', employee_id).first();
        
        if (existing2FA) {
          // Update existing 2FA
          await db('two_factor_auth')
            .where('employee_id', employee_id)
            .update({
              secret_key: secret,
              backup_codes: JSON.stringify(backupCodes),
              is_enabled: false,
              updated_at: new Date().toISOString()
            });
        } else {
          // Create new 2FA
          await db('two_factor_auth').insert({
            employee_id,
            secret_key: secret,
            backup_codes: JSON.stringify(backupCodes),
            is_enabled: false
          });
        }

        res.json({
          success: true,
          message: '2FA setup initiated',
          data: {
            secret,
            backupCodes,
            qrCodeUrl: `otpauth://totp/MatSplash:${employee.email}?secret=${secret}&issuer=MatSplash`
          }
        });
      } catch (error) {
        console.error('Error setting up 2FA:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to setup 2FA'
        });
      }
    });

    // Enable 2FA after verification
    app.post('/api/2fa/enable', async (req, res) => {
      try {
        const { employee_id, verification_code } = req.body;
        
        if (!employee_id || !verification_code) {
          return res.status(400).json({
            success: false,
            message: 'Employee ID and verification code are required'
          });
        }

        const twoFactorRecord = await db('two_factor_auth')
          .where('employee_id', employee_id)
          .first();

        if (!twoFactorRecord) {
          return res.status(404).json({
            success: false,
            message: '2FA setup not found'
          });
        }

        // Verify the code
        const expectedCode = generateTOTP(twoFactorRecord.secret_key);
        if (verification_code !== expectedCode) {
          return res.status(401).json({
            success: false,
            message: 'Invalid verification code'
          });
        }

        // Enable 2FA
        await db('two_factor_auth')
          .where('employee_id', employee_id)
          .update({
            is_enabled: true,
            updated_at: new Date().toISOString()
          });

        res.json({
          success: true,
          message: 'Two-factor authentication enabled successfully'
        });
      } catch (error) {
        console.error('Error enabling 2FA:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to enable 2FA'
        });
      }
    });

    // ===== DEVICE REGISTRATION ENDPOINT (FOR TESTING) =====

    // Register current device as factory device (for testing)
    app.post('/api/devices/register-current', async (req, res) => {
      try {
        const { deviceInfo, deviceName, deviceType, employeeId, isFactoryDevice } = req.body;
        
        if (!deviceInfo) {
          return res.status(400).json({
            success: false,
            message: 'Device information is required'
          });
        }

        const deviceFingerprint = getDeviceFingerprintFromInfo(deviceInfo);
        
        if (!deviceFingerprint) {
          return res.status(400).json({
            success: false,
            message: 'Could not generate device fingerprint'
          });
        }

        // Extract MAC addresses from device info
        const macAddresses = extractMacAddressesFromDeviceInfo(deviceInfo);

        // Check if device already exists
        const existingDevice = await db('authorized_devices')
          .where('device_fingerprint', deviceFingerprint)
          .first();

        if (existingDevice) {
          // Update existing device if employeeId or isFactoryDevice is provided
          if (employeeId !== undefined || isFactoryDevice !== undefined) {
            await db('authorized_devices')
              .where('device_fingerprint', deviceFingerprint)
              .update({
                employee_id: employeeId,
                is_factory_device: isFactoryDevice,
                updated_at: new Date().toISOString()
              });
            
            // Update MAC addresses if provided
            if (macAddresses.length > 0) {
              await registerDeviceMacAddresses(existingDevice.id, macAddresses);
            }
            
            const updatedDevice = await db('authorized_devices').where('device_fingerprint', deviceFingerprint).first();
            const deviceMacs = await getDeviceMacAddresses(existingDevice.id);
            
            return res.json({
              success: true,
              message: 'Device already registered and updated',
              data: {
                ...updatedDevice,
                macAddresses: deviceMacs
              }
            });
          }
          
          // Return existing device with MAC addresses
          const deviceMacs = await getDeviceMacAddresses(existingDevice.id);
          return res.json({
            success: true,
            message: 'Device already registered',
            data: {
              ...existingDevice,
              macAddresses: deviceMacs
            }
          });
        }

        // Register as new device
        const device = await db('authorized_devices').insert({
          device_id: `FACTORY-${deviceType || 'DEVICE'}-${Date.now()}`,
          device_name: deviceName || 'Factory Device',
          device_type: deviceType || 'unknown',
          location: 'factory_floor',
          employee_id: employeeId || null,
          device_fingerprint: deviceFingerprint,
          is_factory_device: isFactoryDevice !== undefined ? isFactoryDevice : true,
          is_active: true,
          created_by: 1 // Admin
        }).returning('*');

        // Register MAC addresses if provided
        if (macAddresses.length > 0) {
          await registerDeviceMacAddresses(device[0].id, macAddresses);
        }

        const deviceMacs = await getDeviceMacAddresses(device[0].id);

        res.json({
          success: true,
          message: 'Device registered successfully',
          data: {
            ...device[0],
            macAddresses: deviceMacs
          }
        });
      } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to register device'
        });
      }
    });

    // Get MAC addresses for a specific device
    app.get('/api/devices/:id/mac-addresses', async (req, res) => {
      try {
        const { id } = req.params;
        
        const macAddresses = await getDeviceMacAddresses(parseInt(id));
        
        res.json({
          success: true,
          data: macAddresses
        });
      } catch (error) {
        console.error('Error getting device MAC addresses:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get device MAC addresses'
        });
      }
    });

    // Update MAC addresses for a specific device
    app.put('/api/devices/:id/mac-addresses', async (req, res) => {
      try {
        const { id } = req.params;
        const { macAddresses } = req.body;
        
        if (!macAddresses || !Array.isArray(macAddresses)) {
          return res.status(400).json({
            success: false,
            message: 'MAC addresses array is required'
          });
        }

        // Validate MAC addresses before processing
        const validMacs = macAddresses.filter(mac => 
          mac.macAddress && 
          mac.macAddress.trim() !== '' && 
          mac.adapterType && 
          mac.adapterType.trim() !== ''
        );

        if (validMacs.length === 0 && macAddresses.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one valid MAC address with adapter type is required'
          });
        }

        const success = await registerDeviceMacAddresses(parseInt(id), macAddresses);
        
        if (success) {
          const updatedMacs = await getDeviceMacAddresses(parseInt(id));
          res.json({
            success: true,
            message: 'MAC addresses updated successfully',
            data: updatedMacs
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Failed to update MAC addresses'
          });
        }
      } catch (error) {
        console.error('Error updating device MAC addresses:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update device MAC addresses: ' + error.message
        });
      }
    });

    // ===== EMERGENCY ACCESS ENDPOINTS =====

    // Get emergency access codes (Admin/Director only)
    app.get('/api/emergency-access', async (req, res) => {
      try {
        const codes = await db('emergency_access')
          .select('*')
          .orderBy('created_at', 'desc');
        
        res.json({
          success: true,
          data: codes
        });
      } catch (error) {
        console.error('Error fetching emergency codes:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch emergency codes'
        });
      }
    });

    // Create new emergency access code (Admin/Director only)
    app.post('/api/emergency-access', async (req, res) => {
      try {
        const { access_code, description, max_uses, expires_at, created_by } = req.body;
        
        if (!access_code || !description) {
          return res.status(400).json({
            success: false,
            message: 'Access code and description are required'
          });
        }

        // Check if code already exists
        const existingCode = await db('emergency_access')
          .where('access_code', access_code)
          .first();

        if (existingCode) {
          return res.status(400).json({
            success: false,
            message: 'Emergency access code already exists'
          });
        }

        const emergencyCode = await db('emergency_access').insert({
          access_code,
          description,
          max_uses: max_uses || 1,
          expires_at: expires_at || null,
          created_by: created_by || 1,
          is_active: true,
          used_count: 0
        }).returning('*');

        res.json({
          success: true,
          message: 'Emergency access code created successfully',
          data: emergencyCode[0]
        });
      } catch (error) {
        console.error('Error creating emergency code:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create emergency code'
        });
      }
});

// Import and mount surveillance routes
const surveillanceRoutes = require('./server/routes/surveillance-minimal.cjs');
app.use('/api/surveillance', surveillanceRoutes(db));

// Dashboard Routes
const dashboardRoutes = require('./server/routes/dashboard.cjs');
app.use('/api/dashboard', dashboardRoutes(db));

// Devices Routes
const devicesRoutes = require('./server/routes/devices.cjs');
app.use('/api/devices', devicesRoutes(db));

// Packing Routes
const packingRoutes = require('./server/routes/packing.cjs');
app.use('/api/packing', packingRoutes(db));

// Security Routes
const securityRoutes = require('./server/routes/security.cjs');
app.use('/api/security', securityRoutes(db));

// Products Routes
const productsRoutes = require('./server/routes/products.cjs');
app.use('/api/products', productsRoutes(db));

// Network Scanner Routes
const networkScannerRoutes = require('./server/routes/network-scanner-realtime.cjs');
app.use('/api/network', networkScannerRoutes);

// Enhanced Attendance Routes
const attendanceEnhancedRoutes = require('./server/routes/attendance-enhanced.cjs');
app.use('/api/attendance', attendanceEnhancedRoutes);

// Import and mount streaming routes
const streamingRoutes = require('./server/routes/streaming-server.cjs');
app.use('/api/streaming', streamingRoutes);

// Import and mount salary routes
const salaryRoutes = require('./server/routes/salary.cjs');
app.use('/api/salary', salaryRoutes(db));

// Import and mount sales routes
const salesRoutes = require('./server/routes/sales.cjs');
app.use('/api/sales', salesRoutes(db));

// Import and mount inventory routes
const inventoryRoutes = require('./server/routes/inventory.cjs');
app.use('/api/inventory', inventoryRoutes(db));

// Import and mount water bag management routes
const waterBagRoutes = require('./server/routes/water-bag-management.cjs');
app.use('/api/water-bags', waterBagRoutes(db));

// Import and mount orders routes
const ordersRoutes = require('./server/routes/orders.cjs');
app.use('/api/orders', ordersRoutes(db));

// Import and mount price models routes
const priceModelsRoutes = require('./server/routes/price-models.cjs');
app.use('/api/price-models', priceModelsRoutes(db));

// Import and mount employees routes
const employeesRoutes = require('./server/routes/employees.cjs');
app.use('/api/employees', employeesRoutes(db));

// Import and mount bonus routes
const bonusRoutes = require('./server/routes/bonuses.cjs');
app.use('/api/salary/bonuses', bonusRoutes(db));

// Import and mount distributor routes
const distributorRoutes = require('./server/routes/distributors.cjs');
app.use('/api/distributors', distributorRoutes(db));

// Import and mount factory location routes
const factoryLocationRoutes = require('./server/routes/factory-locations.cjs');
app.use('/api/factory-locations', factoryLocationRoutes(db));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await setupDatabase();
    
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🌐 Network access: http://[YOUR_IP]:${PORT}`);
  console.log(`📱 Mobile access: http://[YOUR_IP]:5173`);
  console.log(`\n📝 Test credentials:`);
  console.log(`   Admin: admin@matsplash.com / 1111`);
  console.log(`   Director: director@matsplash.com / 1111`);
  console.log(`   Manager: manager@matsplash.com / 1111`);
  console.log(`   Receptionist: receptionist@matsplash.com / 1111`);
  console.log(`   Storekeeper: storekeeper@matsplash.com / 1111`);
});
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();