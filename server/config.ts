// MatSplash Web Application Configuration

export const config = {
  // Server Configuration
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // JWT Secret
  jwtSecret: process.env.JWT_SECRET || 'matsplash-secret-key-2024-production',
  
  // Database Configuration
  database: {
    client: 'sqlite3',
    filename: './database.sqlite'
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  
  // GCP Configuration (for future deployment)
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || '',
    region: process.env.GCP_REGION || 'us-central1',
    serviceAccountKey: process.env.GCP_SERVICE_ACCOUNT_KEY || ''
  }
};
