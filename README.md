# MatSplash Web Application

A modern web-based factory management system for water sachet production and distribution. This application provides comprehensive management tools for employees, orders, inventory, and surveillance.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login with PIN-based authentication
- **Role-Based Access Control**: Different dashboards for Admin, Director, Manager, Receptionist, Storekeeper, and other roles
- **Employee Management**: Complete employee lifecycle management
- **Order Management**: Three order types (General Sales, Distributor Orders, Driver Dispatches)
- **Inventory Tracking**: Real-time inventory management with audit logs
- **Attendance System**: Clock-in/out functionality with comprehensive reporting
- **Surveillance Center**: Camera management and live stream viewing
- **Dashboard Analytics**: Real-time statistics and reporting

### User Roles
- **Admin**: Full system access and configuration
- **Director**: Comprehensive oversight and reporting
- **Manager**: Order management and approval workflows
- **Receptionist**: Order creation and customer service
- **Storekeeper**: Inventory management and order processing
- **Driver/Assistant**: Delivery management and commission tracking
- **Packer/Operator/Cleaner**: Production and maintenance roles

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for modern UI components
- **React Router** for navigation
- **Axios** for API communication
- **Vite** for fast development and building

### Backend
- **Node.js** with Express.js
- **SQLite** database with Knex.js ORM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd matsplash-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start them separately:
   npm run server  # Backend on port 3001
   npm run dev     # Frontend on port 5173
   ```

## 🔧 Configuration

### Environment Variables
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)
- `JWT_SECRET`: Secret key for JWT tokens
- `DB_FILENAME`: SQLite database file path

### Default Users
The system comes with pre-configured users (PIN: 1111):
- **Admin**: admin@matsplash.com
- **Director**: director@matsplash.com
- **Manager**: manager@matsplash.com
- **Receptionist**: receptionist@matsplash.com
- **Storekeeper**: storekeeper@matsplash.com

## 🏗️ Project Structure

```
matsplash-web/
├── src/
│   ├── components/          # Reusable UI components
│   ├── context/            # React context providers
│   ├── pages/              # Page components
│   ├── services/           # API service functions
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── server/
│   ├── routes/             # Express route handlers
│   ├── database.ts         # Database setup and configuration
│   ├── config.ts           # Application configuration
│   └── index.ts            # Server entry point
├── public/                 # Static assets
└── package.json
```

## 🚀 Deployment

### GCP Deployment (Recommended)
This application is designed to be deployed on Google Cloud Platform:

1. **App Engine**: For easy deployment and scaling
2. **Cloud SQL**: For production database (PostgreSQL/MySQL)
3. **Cloud Storage**: For file uploads and static assets
4. **Cloud Build**: For CI/CD pipeline

### Local Production Build
```bash
npm run build
npm run server
```

## 📊 Database Schema

The application uses SQLite with the following main tables:
- `employees`: User and employee information
- `orders`: Order management (general, distributor, driver dispatch)
- `inventory_logs`: Inventory tracking and audit
- `attendance_logs`: Employee attendance records
- `packing_logs`: Production tracking
- `dispatch_logs`: Delivery management
- `driver_sales_logs`: Sales and commission tracking
- `cameras`: Surveillance system
- `system_activity`: Audit trail

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access**: Granular permissions per user role
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Server-side validation for all inputs
- **Audit Logging**: Comprehensive activity tracking

## 🎯 Business Logic

### Order Types
1. **General Sales**: Walk-in customers
2. **Distributor Orders**: Registered distributors
3. **Driver Dispatches**: Company driver deliveries

### Workflow Management
- **Order Creation** → **Storekeeper Processing** → **Delivery/Pickup** → **Settlement** → **Completion**
- **Approval Chains**: Manager and Director approval workflows
- **Commission Calculation**: Automatic commission tracking for drivers
- **Inventory Management**: Real-time stock updates

## 🚀 Future Enhancements

- **Mobile App**: React Native mobile application
- **Payment Integration**: Online payment processing
- **Advanced Analytics**: Business intelligence dashboard
- **IoT Integration**: Real-time production monitoring
- **Multi-language Support**: Internationalization
- **Cloud Backup**: Automated data backup and recovery

## 📝 License

This project is proprietary software for MatSplash Factory Management.

## 🤝 Support

For support and questions, please contact the development team.

---

**MatSplash Web Application** - Modern Factory Management System