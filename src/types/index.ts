// MatSplash Web Application Types
// Based on the original Electron application

export interface User {
  id: number;
  email: string;
  phone?: string;
  name: string;
  role: 'Admin' | 'Director' | 'Manager' | 'Receptionist' | 'StoreKeeper' | 'Packer' | 'Driver' | 'Driver Assistant' | 'Sales' | 'Security' | 'Cleaner' | 'Operator' | 'Loader';
  pin?: string;
  isEmployee: boolean; // Admin and Director are non-employees
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  first_login?: boolean;
  salary_type?: 'fixed' | 'commission';
  fixed_salary?: number;
  commission_rate?: number;
  can_access_remotely?: boolean;
}

export interface Distributor {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  total_orders: number;
  total_amount: number;
  last_order_date?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: 'general' | 'distributor' | 'driver_dispatch';
  customer_name?: string;
  customer_phone?: string;
  distributor_id?: number;
  driver_id?: number;
  assistant_id?: number;
  requested_by: number;
  
  // Order Details
  bags_ordered: number;
  free_bags_included: number;
  free_bags_redeemed: number;
  total_bags: number;
  price_per_bag: number;
  total_amount: number;
  
  // Fulfillment Details
  delivery_method: 'pickup' | 'delivery';
  pickup_location?: string;
  delivery_address?: string;
  
  // Status Tracking
  status: 'pending_pickup' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'settlement_pending' | 'settled' | 'completed' | 'cancelled';
  
  // Settlement Data (for driver orders)
  bags_returned?: number;
  leakage_sachets?: number;
  adjusted_bags_sold?: number;
  settlement_amount?: number;
  
  // Workflow Tracking
  created_at: string;
  picked_up_at?: string;
  delivered_at?: string;
  settled_at?: string;
  completed_at?: string;
  
  // Approval Chain
  storekeeper_approval?: {
    approved_by: number;
    approved_at: string;
    notes?: string;
  };
  manager_approval?: {
    approved_by: number;
    approved_at: string;
    notes?: string;
    discrepancy_found?: boolean;
    adjustment_made?: boolean;
  };
}

export interface InventoryLog {
  id: number;
  order_id?: number;
  order_number?: string;
  bags_added: number;
  bags_removed: number;
  current_stock: number;
  operation_type: 'order_pickup' | 'return_processing' | 'manual_adjustment' | 'initial_stock';
  performed_by: number;
  notes?: string;
  created_at: string;
}

export interface AttendanceLog {
  id: number;
  employee_id: number;
  employee_email: string;
  clock_in_time: string;
  clock_out_time?: string;
  total_hours?: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
  created_at: string;
}

export interface PackingLog {
  id: number;
  packer_email: string;
  bags_packed: number;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  notes?: string;
  created_at: string;
}

export interface DispatchLog {
  id: number;
  order_number: string;
  driver_email: string;
  assistant_email?: string;
  bags_dispatched: number;
  delivery_address: string;
  dispatch_time: string;
  delivery_time?: string;
  status: 'dispatched' | 'delivered' | 'returned' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface DriverSalesLog {
  id: number;
  order_number: string;
  driver_email: string;
  assistant_email?: string;
  bags_sold: number;
  bags_returned: number;
  leakage_sachets: number;
  total_amount: number;
  commission_amount: number;
  delivery_date: string;
  settlement_date?: string;
  status: 'pending_settlement' | 'settled' | 'discrepancy';
  notes?: string;
  created_at: string;
}

export interface Camera {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  stream_url: string;
  status: 'online' | 'offline';
  location?: string;
  model?: string;
  manufacturer?: string;
  created_at: string;
  last_seen?: string;
}

export interface CameraCredentials {
  id: number;
  username: string;
  password: string;
  description: string;
  created_at: string;
}

export interface SystemActivity {
  id: number;
  user_id: number;
  user_email: string;
  action: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  emailOrPhone: string;
  pin: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Dashboard Data Types
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalOrders: number;
  pendingOrders: number;
  totalInventory: number;
  lowStockItems: number;
  totalSales: number;
  monthlySales: number;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  employeesByRole: Record<string, number>;
  attendanceRate: number;
  averageHours: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  ordersByType: Record<string, number>;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface InventoryStats {
  totalStock: number;
  lowStockItems: number;
  stockByType: Record<string, number>;
  recentMovements: InventoryLog[];
}

// Form Types
export interface CreateOrderForm {
  order_type: 'general' | 'distributor' | 'driver_dispatch';
  customer_name?: string;
  customer_phone?: string;
  distributor_id?: number;
  driver_id?: number;
  assistant_id?: number;
  bags_ordered: number;
  free_bags_included: number;
  price_per_bag: number;
  delivery_method: 'pickup' | 'delivery';
  delivery_address?: string;
  notes?: string;
}

export interface CreateEmployeeForm {
  name: string;
  email: string;
  phone: string;
  role: User['role'];
  salary_type: 'fixed' | 'commission';
  fixed_salary?: number;
  commission_rate?: number;
  can_access_remotely: boolean;
}

export interface CreateDistributorForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

// Filter and Search Types
export interface OrderFilters {
  status?: string[];
  order_type?: string[];
  date_from?: string;
  date_to?: string;
  employee_id?: number;
}

export interface EmployeeFilters {
  role?: string[];
  status?: string[];
  salary_type?: string[];
}

export interface AttendanceFilters {
  employee_id?: number;
  date_from?: string;
  date_to?: string;
  status?: string[];
}
