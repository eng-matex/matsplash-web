import knex, { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

// Database configuration
const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true,
  migrations: {
    directory: './migrations'
  }
};

export const db = knex(config);

// Default users for the system
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
    salary_type: 'commission',
    fixed_salary: null,
    commission_rate: 5.00,
    can_access_remotely: false
  },
  {
    name: 'Driver Assistant',
    email: 'driver.assistant@matsplash.com',
    phone: '+2341234567807',
    role: 'Driver Assistant',
    defaultPin: '1111',
    status: 'active',
    deletion_status: 'Active',
    is_archived: false,
    first_login: false,
    salary_type: 'commission',
    fixed_salary: null,
    commission_rate: 3.00,
    can_access_remotely: false
  },
  {
    name: 'Packer',
    email: 'packer@matsplash.com',
    phone: '+2341234567808',
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
    phone: '+2341234567809',
    role: 'Sales',
    defaultPin: '1111',
    status: 'active',
    deletion_status: 'Active',
    is_archived: false,
    first_login: false,
    salary_type: 'commission',
    fixed_salary: 50000.00,
    commission_rate: 7.00,
    can_access_remotely: true
  },
  {
    name: 'Security Guard',
    email: 'security@matsplash.com',
    phone: '+2341234567810',
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
    phone: '+2341234567811',
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
    phone: '+2341234567812',
    role: 'Operator',
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
    name: 'Loader',
    email: 'loader@matsplash.com',
    phone: '+2341234567813',
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

async function createDefaultUsers() {
  try {
    console.log('Creating default admin and director accounts...');
    
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
        const saltRounds = 10;
        const newPinHash = await bcrypt.hash('1111', saltRounds);
        await db('employees')
          .where({ email: user.email })
          .update({
            first_login: false,
            pin_hash: newPinHash
          });
        console.log(`Updated ${user.role} account PIN to 1111: ${user.email}`);
      }
    }
    
    console.log('Default users setup complete');
  } catch (error) {
    console.error('Error creating default users:', error);
  }
}

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create employees table
    await db.schema.hasTable('employees').then(async (exists) => {
      if (!exists) {
        console.log('Creating employees table...');
        return db.schema.createTable('employees', (table) => {
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
          table.timestamps(true, true);
        });
      } else {
        console.log('Employees table exists, checking columns...');
        // Add missing columns if they don't exist
        const hasFirstLogin = await db.schema.hasColumn('employees', 'first_login');
        if (!hasFirstLogin) {
          await db.schema.alterTable('employees', (table) => {
            table.boolean('first_login').defaultTo(false);
          });
        }
        
        const hasSalaryType = await db.schema.hasColumn('employees', 'salary_type');
        if (!hasSalaryType) {
          await db.schema.alterTable('employees', (table) => {
            table.string('salary_type').defaultTo('fixed');
            table.decimal('fixed_salary', 10, 2);
            table.decimal('commission_rate', 5, 2);
            table.boolean('can_access_remotely').defaultTo(false);
          });
        }
      }
    });

    // Create distributors table
    if (!await db.schema.hasTable('distributors')) {
      await db.schema.createTable('distributors', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').unique().notNullable();
        table.string('phone').notNullable();
        table.text('address').notNullable();
        table.string('city').notNullable();
        table.string('state').notNullable();
        table.integer('total_orders').defaultTo(0);
        table.decimal('total_amount', 10, 2).defaultTo(0);
        table.timestamp('last_order_date');
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });
    }

    // Create orders table
    if (!await db.schema.hasTable('orders')) {
      await db.schema.createTable('orders', (table) => {
        table.increments('id').primary();
        table.string('order_number').unique().notNullable();
        table.string('order_type').notNullable(); // 'general', 'distributor', 'driver_dispatch'
        table.string('customer_name');
        table.string('customer_phone');
        table.integer('distributor_id').references('id').inTable('distributors');
        table.integer('driver_id').references('id').inTable('employees');
        table.integer('assistant_id').references('id').inTable('employees');
        table.integer('requested_by').references('id').inTable('employees').notNullable();
        
        // Order Details
        table.integer('bags_ordered').notNullable();
        table.integer('free_bags_included').defaultTo(0);
        table.integer('free_bags_redeemed').defaultTo(0);
        table.integer('total_bags').notNullable();
        table.decimal('price_per_bag', 10, 2).notNullable();
        table.decimal('total_amount', 10, 2).notNullable();
        
        // Fulfillment Details
        table.string('delivery_method').defaultTo('pickup');
        table.text('pickup_location');
        table.text('delivery_address');
        
        // Status Tracking
        table.string('status').defaultTo('pending_pickup');
        
        // Settlement Data
        table.integer('bags_returned');
        table.integer('leakage_sachets');
        table.integer('adjusted_bags_sold');
        table.decimal('settlement_amount', 10, 2);
        
        // Workflow Tracking
        table.timestamp('picked_up_at');
        table.timestamp('delivered_at');
        table.timestamp('settled_at');
        table.timestamp('completed_at');
        
        // Approval Chain
        table.json('storekeeper_approval');
        table.json('manager_approval');
        
        table.timestamps(true, true);
      });
    }

    // Create inventory_logs table
    if (!await db.schema.hasTable('inventory_logs')) {
      await db.schema.createTable('inventory_logs', (table) => {
        table.increments('id').primary();
        table.integer('order_id').references('id').inTable('orders');
        table.string('order_number');
        table.integer('bags_added').defaultTo(0);
        table.integer('bags_removed').defaultTo(0);
        table.integer('current_stock').notNullable();
        table.string('operation_type').notNullable();
        table.integer('performed_by').references('id').inTable('employees').notNullable();
        table.text('notes');
        table.timestamps(true, true);
      });
    }

    // Create attendance_logs table
    if (!await db.schema.hasTable('attendance_logs')) {
      await db.schema.createTable('attendance_logs', (table) => {
        table.increments('id').primary();
        table.integer('employee_id').references('id').inTable('employees').notNullable();
        table.string('employee_email').notNullable();
        table.timestamp('clock_in_time').notNullable();
        table.timestamp('clock_out_time');
        table.decimal('total_hours', 5, 2);
        table.date('date').notNullable();
        table.string('status').defaultTo('present');
        table.text('notes');
        table.timestamps(true, true);
      });
    }

    // Create packing_logs table
    if (!await db.schema.hasTable('packing_logs')) {
      await db.schema.createTable('packing_logs', (table) => {
        table.increments('id').primary();
        table.string('packer_email').notNullable();
        table.integer('bags_packed').notNullable();
        table.date('date').notNullable();
        table.string('shift').notNullable();
        table.text('notes');
        table.timestamps(true, true);
      });
    }

    // Create dispatch_logs table
    if (!await db.schema.hasTable('dispatch_logs')) {
      await db.schema.createTable('dispatch_logs', (table) => {
        table.increments('id').primary();
        table.string('order_number').notNullable();
        table.string('driver_email').notNullable();
        table.string('assistant_email');
        table.integer('bags_dispatched').notNullable();
        table.text('delivery_address').notNullable();
        table.timestamp('dispatch_time').notNullable();
        table.timestamp('delivery_time');
        table.string('status').defaultTo('dispatched');
        table.text('notes');
        table.timestamps(true, true);
      });
    }

    // Create driver_sales_logs table
    if (!await db.schema.hasTable('driver_sales_logs')) {
      await db.schema.createTable('driver_sales_logs', (table) => {
        table.increments('id').primary();
        table.string('order_number').notNullable();
        table.string('driver_email').notNullable();
        table.string('assistant_email');
        table.integer('bags_sold').notNullable();
        table.integer('bags_returned').defaultTo(0);
        table.integer('leakage_sachets').defaultTo(0);
        table.decimal('total_amount', 10, 2).notNullable();
        table.decimal('commission_amount', 10, 2).notNullable();
        table.date('delivery_date').notNullable();
        table.timestamp('settlement_date');
        table.string('status').defaultTo('pending_settlement');
        table.text('notes');
        table.timestamps(true, true);
      });
    }

    // Create cameras table
    if (!await db.schema.hasTable('cameras')) {
      await db.schema.createTable('cameras', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('ip_address').notNullable();
        table.integer('port').defaultTo(80);
        table.string('username').notNullable();
        table.string('password').notNullable();
        table.string('stream_url');
        table.string('status').defaultTo('offline');
        table.string('location');
        table.string('model');
        table.string('manufacturer');
        table.timestamp('last_seen');
        table.string('resolution').defaultTo('1920x1080');
        table.integer('fps').defaultTo(30);
        table.boolean('night_vision').defaultTo(false);
        table.boolean('motion_detection').defaultTo(true);
        table.boolean('audio_enabled').defaultTo(false);
        table.boolean('recording_enabled').defaultTo(true);
        table.boolean('continuous_recording').defaultTo(false);
        table.decimal('storage_used', 10, 2).defaultTo(0);
        table.decimal('storage_total', 10, 2).defaultTo(100);
        table.timestamps(true, true);
      });
    } else {
      // Add new columns to existing cameras table if they don't exist
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.string('resolution').defaultTo('1920x1080');
        });
      } catch (error) {
        console.log('resolution column may already exist');
      }
      
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.integer('fps').defaultTo(30);
        });
      } catch (error) {
        console.log('fps column may already exist');
      }
      
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.boolean('night_vision').defaultTo(false);
        });
      } catch (error) {
        console.log('night_vision column may already exist');
      }
      
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.boolean('motion_detection').defaultTo(true);
        });
      } catch (error) {
        console.log('motion_detection column may already exist');
      }
      
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.boolean('audio_enabled').defaultTo(false);
        });
      } catch (error) {
        console.log('audio_enabled column may already exist');
      }
      
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.boolean('recording_enabled').defaultTo(true);
        });
      } catch (error) {
        console.log('recording_enabled column may already exist');
      }
      
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.boolean('continuous_recording').defaultTo(false);
        });
      } catch (error) {
        console.log('continuous_recording column may already exist');
      }
      
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.decimal('storage_used', 10, 2).defaultTo(0);
        });
      } catch (error) {
        console.log('storage_used column may already exist');
      }
      
      try {
        await db.schema.alterTable('cameras', (table) => {
          table.decimal('storage_total', 10, 2).defaultTo(100);
        });
      } catch (error) {
        console.log('storage_total column may already exist');
      }
    }

    // Create camera_credentials table
    if (!await db.schema.hasTable('camera_credentials')) {
      await db.schema.createTable('camera_credentials', (table) => {
        table.increments('id').primary();
        table.string('username').notNullable();
        table.string('password').notNullable();
        table.string('description');
        table.boolean('is_default').defaultTo(false);
        table.timestamps(true, true);
      });
    }

    // Create recording_sessions table
    if (!await db.schema.hasTable('recording_sessions')) {
      await db.schema.createTable('recording_sessions', (table) => {
        table.string('id').primary();
        table.integer('camera_id').references('id').inTable('cameras').notNullable();
        table.timestamp('start_time').notNullable();
        table.timestamp('end_time');
        table.string('status').defaultTo('recording'); // recording, stopped, paused
        table.string('recording_type').defaultTo('manual'); // manual, motion, continuous, scheduled
        table.string('file_path');
        table.integer('duration'); // in seconds
        table.decimal('file_size', 15, 2); // in MB
        table.integer('motion_events').defaultTo(0);
        table.text('notes');
        table.timestamps(true, true);
      });
    }

    // Create system_activity table
    if (!await db.schema.hasTable('system_activity')) {
      await db.schema.createTable('system_activity', (table) => {
        table.increments('id').primary();
        table.integer('user_id').references('id').inTable('employees').notNullable();
        table.string('user_email').notNullable();
        table.string('action').notNullable();
        table.text('details').notNullable();
        table.string('ip_address');
        table.text('user_agent');
        table.timestamps(true, true);
      });
    }

    // Create default users
    await createDefaultUsers();
    
    console.log('Database setup complete');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

export default setupDatabase;
