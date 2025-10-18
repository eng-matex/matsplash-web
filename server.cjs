const express = require('express');
const cors = require('cors');
const path = require('path');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      'dispatch_logs', 'driver_sales_logs', 'cameras', 'camera_credentials', 'system_activity'
    ];

    for (const tableName of tables) {
      const hasTable = await db.schema.hasTable(tableName);
      if (!hasTable) {
        console.log(`Creating ${tableName} table...`);
        // Create basic table structure - you can expand this as needed
        await db.schema.createTable(tableName, (table) => {
          table.increments('id').primary();
          table.timestamps(true, true);
        });
      }
    }
    
    console.log('✅ Database setup complete');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
  const { emailOrPhone, pin } = req.body;

    if (!emailOrPhone || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and PIN are required'
      });
    }
  
  console.log('Login attempt:', { emailOrPhone, pin: 'PROVIDED' });
  
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

    console.log('User found:', { id: user.id, name: user.name, email: user.email });

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

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'matsplash-secret-key-2024';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await db('employees')
      .where('id', user.id)
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

// Mock employees endpoint
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await db('employees')
      .where('deletion_status', 'Active')
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary_type', 'fixed_salary', 'commission_rate', 'can_access_remotely')
      .orderBy('name');

    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      isEmployee: emp.role !== 'Admin' && emp.role !== 'Director',
      isActive: emp.status === 'active',
      createdAt: emp.created_at,
      lastLogin: emp.last_login,
      salary_type: emp.salary_type,
      fixed_salary: emp.fixed_salary,
      commission_rate: emp.commission_rate,
      can_access_remotely: emp.can_access_remotely
    }));
  
  res.json({
    success: true,
      data: formattedEmployees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    });
  }
});

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
    
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
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