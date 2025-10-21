// API configuration utility
export const API_BASE_URL = 'http://localhost:3002/api';

// Helper function to create API URLs
export const createApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VERIFY: '/auth/verify',
  
  // Employees
  EMPLOYEES: '/employees',
  EMPLOYEE_BY_ID: (id: string) => `/employees/${id}`,
  EMPLOYEE_RESET_PIN: (id: string) => `/employees/${id}/reset-pin`,
  EMPLOYEE_ADMIN_LOGIN: (id: string) => `/employees/${id}/admin-login`,
  EMPLOYEE_ADMIN_LOGOUT: '/employees/admin-logout',
  
  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  ORDER_STATUS: (id: string) => `/orders/${id}/status`,
  
  // Sales
  SALES_ORDERS: '/sales/orders',
  DRIVER_SALES: '/sales/driver-sales',
  DRIVER_SETTLEMENT: '/sales/driver-settlement',
  DRIVERS: '/sales/drivers',
  COMMISSION_APPROVE: (id: string) => `/sales/commission/${id}/approve`,
  COMMISSION_REJECT: (id: string) => `/sales/commission/${id}/reject`,
  
  // Inventory
  INVENTORY: '/inventory',
  INVENTORY_STATS: '/inventory/stats',
  ADD_WATER: '/inventory/add-water',
  
  // Attendance
  ATTENDANCE: '/attendance',
  ATTENDANCE_STATUS: (id: string) => `/attendance/status/${id}`,
  CLOCK_IN: '/attendance/clock-in',
  CLOCK_OUT: '/attendance/clock-out',
  START_BREAK: '/attendance/start-break',
  END_BREAK: '/attendance/end-break',
  
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  
  // Devices
  DEVICES: '/devices',
  DEVICE_BY_ID: (id: string) => `/devices/${id}`,
  DEVICE_MAC_ADDRESSES: (id: string) => `/devices/${id}/mac-addresses`,
  DEVICE_FACTORY_ASSIGNMENTS: (id: string) => `/devices/${id}/factory-assignments`,
  
  // Factory Locations
  FACTORY_LOCATIONS: '/factory-locations',
  FACTORY_LOCATION_BY_ID: (id: string) => `/factory-locations/${id}`,
  FACTORY_DEVICES: (id: string) => `/factory-locations/${id}/devices`,
  FACTORY_DEVICE_ASSIGNMENTS: (id: string) => `/factory-locations/devices/${id}/factory-assignments`,
  
  // Distributors
  DISTRIBUTORS: '/distributors',
  DISTRIBUTOR_BY_ID: (id: string) => `/distributors/${id}`,
  
  // Price Models
  PRICE_MODELS: '/price-models',
  PRICE_MODEL_BY_ID: (id: string) => `/price-models/${id}`,
  
  // Health
  HEALTH: '/health'
};

// Helper function to get full URL for an endpoint
export const getApiUrl = (endpoint: string): string => {
  return createApiUrl(endpoint);
};
