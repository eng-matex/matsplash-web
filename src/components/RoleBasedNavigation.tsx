import React from 'react';
import {
  Dashboard as DashboardIcon,
  Assignment,
  People,
  Inventory,
  AccessTime,
  Security,
  LocalShipping,
  Business,
  PointOfSale,
  Assessment,
  History,
  AdminPanelSettings,
  SupervisorAccount,
  Engineering,
  CleaningServices,
  Payment,
  Lock,
  Search,
  CheckCircle,
  Devices,
  LocationOn,
  Videocam,
  Phone
} from '@mui/icons-material';

// Navigation sections for different roles
export const getRoleNavigation = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return [
        { id: 'overview', label: 'Global Overview', icon: DashboardIcon, color: '#2196f3' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' },
        { id: 'attendance-enhanced', label: 'All Employee Attendance', icon: AccessTime, color: '#607d8b' },
        { id: 'admin-clock', label: 'Admin Clock-In/Out', icon: SupervisorAccount, color: '#e91e63' },
        { id: 'packing-workflow', label: 'Packing Workflow', icon: Assignment, color: '#9c27b0' },
        { id: 'comprehensive-log', label: '🔒 Comprehensive Log', icon: Lock, color: '#ff5722' },
        { id: 'distributor-mgmt', label: 'Distributor Management', icon: Business, color: '#9c27b0' },
        { id: 'pricing', label: 'Pricing Management', icon: PointOfSale, color: '#ff9800' },
        { id: 'driver-dispatches', label: 'Driver Dispatches', icon: LocalShipping, color: '#ff9800' },
        { id: 'customer-calls', label: 'Customer Calls (50+)', icon: Phone, color: '#4caf50' },
        { id: 'inventory-management', label: 'Inventory Management', icon: Inventory, color: '#00bcd4' },
        { id: 'sales-management', label: 'Sales Management', icon: PointOfSale, color: '#ff5722' },
        { id: 'reports', label: 'Reports & Analytics', icon: Assessment, color: '#673ab7' },
        { id: 'surveillance', label: '📹 Surveillance Center', icon: Search, color: '#673ab7' },
        { id: 'advanced-cctv', label: '🎥 Advanced CCTV/NVR', icon: Videocam, color: '#f44336' },
        { id: 'system-activity', label: 'System Activity', icon: Assessment, color: '#795548' }
      ];

    case 'manager':
      return [
        { id: 'overview', label: 'Global Overview', icon: DashboardIcon, color: '#2196f3' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' },
        { id: 'attendance-enhanced', label: 'All Employee Attendance', icon: AccessTime, color: '#607d8b' },
        { id: 'employee-mgmt', label: 'Employee Management', icon: People, color: '#4caf50' },
        { id: 'new-employee', label: 'Add Employee', icon: SupervisorAccount, color: '#13bbc6' },
        { id: 'packing-workflow', label: 'Packing Workflow', icon: Assignment, color: '#9c27b0' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'admin-clock', label: 'Admin Clock-In/Out', icon: SupervisorAccount, color: '#e91e63' },
        { id: 'comprehensive-log', label: '🔒 Comprehensive Log', icon: Lock, color: '#ff5722' },
        { id: 'distributor-mgmt', label: 'Distributor Management', icon: Business, color: '#9c27b0' },
        { id: 'commission-approval', label: 'Commission Approval', icon: CheckCircle, color: '#4caf50' },
        { id: 'driver-dispatches', label: 'Driver Dispatches', icon: LocalShipping, color: '#ff9800' },
        { id: 'customer-calls', label: 'Customer Calls (50+)', icon: Phone, color: '#4caf50' },
        { id: 'inventory-management', label: 'Inventory Management', icon: Inventory, color: '#00bcd4' },
        { id: 'sales-management', label: 'Sales Management', icon: PointOfSale, color: '#ff5722' },
        { id: 'reports', label: 'Reports & Analytics', icon: Assessment, color: '#673ab7' },
        { id: 'surveillance', label: '📹 Surveillance Center', icon: Search, color: '#673ab7' },
        { id: 'advanced-cctv', label: '🎥 Advanced CCTV/NVR', icon: Videocam, color: '#f44336' },
        { id: 'system-activity', label: 'System Activity', icon: Assessment, color: '#795548' }
      ];

    case 'director':
      return [
        { id: 'overview', label: 'Global Overview', icon: DashboardIcon, color: '#2196f3' },
        { id: 'attendance-enhanced', label: 'All Employee Attendance', icon: AccessTime, color: '#607d8b' },
        { id: 'device-management', label: 'Device Management', icon: Devices, color: '#13bbc6' },
        { id: 'factory-mgmt', label: 'Factory Management', icon: LocationOn, color: '#00bcd4' },
        { id: 'employee-mgmt', label: 'Employee Management', icon: People, color: '#4caf50' },
        { id: 'packing-workflow', label: 'Packing Workflow', icon: Assignment, color: '#9c27b0' },
        { id: 'distributor-mgmt', label: 'Distributor Management', icon: Business, color: '#9c27b0' },
        { id: 'pricing', label: 'Pricing Management', icon: PointOfSale, color: '#ff9800' },
        { id: 'salary', label: '💲 Salary Management', icon: Payment, color: '#4caf50' },
        { id: 'driver-dispatches', label: 'Driver Dispatches', icon: LocalShipping, color: '#ff9800' },
        { id: 'customer-calls', label: 'Customer Calls (50+)', icon: Phone, color: '#4caf50' },
        { id: 'inventory-management', label: 'Inventory Management', icon: Inventory, color: '#00bcd4' },
        { id: 'sales-management', label: 'Sales Management', icon: PointOfSale, color: '#ff5722' },
        { id: 'reports', label: 'Reports & Analytics', icon: Assessment, color: '#673ab7' },
        { id: 'surveillance', label: '📹 Surveillance Center', icon: Search, color: '#673ab7' },
        { id: 'advanced-cctv', label: '🎥 Advanced CCTV/NVR', icon: Videocam, color: '#f44336' }
      ];

    case 'receptionist':
      return [
        { id: 'overview', label: 'Order Management', icon: DashboardIcon, color: '#2196f3' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'inventory', label: 'Inventory Management', icon: Inventory, color: '#ff9800' },
        { id: 'sales-management', label: 'Sales Management', icon: PointOfSale, color: '#ff5722' },
        { id: 'general-sales', label: 'General Sales', icon: PointOfSale, color: '#4caf50' },
        { id: 'distributor-orders', label: 'Distributor Orders', icon: Business, color: '#9c27b0' },
        { id: 'driver-dispatches', label: 'Driver Dispatches', icon: LocalShipping, color: '#ff9800' },
        { id: 'customer-calls', label: 'Customer Calls (50+)', icon: Phone, color: '#4caf50' },
        { id: 'store-dispatch', label: 'Store Dispatch', icon: LocalShipping, color: '#9c27b0' },
        { id: 'driver-settlement', label: 'Driver Settlement', icon: Payment, color: '#ff5722' },
        { id: 'order-status-logs', label: 'Order Status Logs', icon: Assessment, color: '#2196f3' }
      ];

    case 'storekeeper':
      return [
        { id: 'overview', label: 'Order Management', icon: DashboardIcon, color: '#2196f3' },
        { id: 'packing-workflow', label: 'Packing Workflow', icon: Assignment, color: '#9c27b0' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'pickup-confirmations', label: 'Pickup Confirmations', icon: CheckCircle, color: '#4caf50' },
        { id: 'inventory-audit', label: 'Inventory Audit', icon: Assessment, color: '#ff5722' },
        { id: 'inventory-management', label: 'Inventory Management', icon: Inventory, color: '#ff9800' },
        { id: 'order-status-logs', label: 'Order Status Logs', icon: Assessment, color: '#2196f3' }
      ];

    case 'driver':
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'active-dispatches', label: 'Active Dispatches', icon: LocalShipping, color: '#ff9800' },
        { id: 'dispatch-log', label: 'Dispatch Log', icon: Assessment, color: '#ff5722' },
        { id: 'sales-accounting', label: 'Sales & Commission', icon: Payment, color: '#4caf50' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];

    case 'driver assistant':
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'active-dispatches', label: 'Active Dispatches', icon: LocalShipping, color: '#ff9800' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];

    case 'packer':
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];

    case 'sales':
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'sales-entry', label: 'Sales Entry', icon: PointOfSale, color: '#4caf50' },
        { id: 'sales-history', label: 'Sales History', icon: History, color: '#ff9800' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];

    case 'security':
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'gate-log', label: 'Gate Activity', icon: Assessment, color: '#ff5722' },
        { id: 'incident-reports', label: 'Incident Reports', icon: Security, color: '#f44336' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];

    case 'cleaner':
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'cleaning-tasks', label: 'Cleaning Tasks', icon: CleaningServices, color: '#4caf50' },
        { id: 'supply-inventory', label: 'Supply Inventory', icon: Inventory, color: '#ff9800' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];

    case 'operator':
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'maintenance-tasks', label: 'Maintenance Tasks', icon: Engineering, color: '#ff5722' },
        { id: 'equipment-status', label: 'Equipment Status', icon: Inventory, color: '#4caf50' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];

    case 'loader':
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'clock-in-out', label: 'Clock In/Out', icon: AccessTime, color: '#13bbc6' },
        { id: 'loading-tasks', label: 'Loading Tasks', icon: Inventory, color: '#4caf50' },
        { id: 'inventory-management', label: 'Inventory Management', icon: Inventory, color: '#ff9800' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];

    default:
      return [
        { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#2196f3' },
        { id: 'my-attendance', label: 'My Attendance', icon: AccessTime, color: '#607d8b' }
      ];
  }
};

export const getDefaultView = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'receptionist':
    case 'storekeeper':
      return 'overview';
    case 'manager':
    case 'admin':
    case 'director':
      return 'overview';
    default:
      return 'overview';
  }
};
