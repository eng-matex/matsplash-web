import * as express from 'express';
import { db } from '../database';
import { ApiResponse, DashboardStats, EmployeeStats, OrderStats, InventoryStats } from '../../src/types';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get employee statistics
    const totalEmployees = await db('employees')
      .where('status', 'active')
      .andWhere('deletion_status', 'Active')
      .count('id as count')
      .first();

    const activeEmployees = await db('employees')
      .where('status', 'active')
      .andWhere('deletion_status', 'Active')
      .andWhere('is_archived', false)
      .count('id as count')
      .first();

    // Get order statistics
    const totalOrders = await db('orders').count('id as count').first();
    const pendingOrders = await db('orders')
      .whereIn('status', ['pending_pickup', 'picked_up', 'out_for_delivery'])
      .count('id as count')
      .first();

    // Get inventory statistics
    const inventoryLogs = await db('inventory_logs')
      .orderBy('created_at', 'desc')
      .limit(1)
      .first();

    const totalInventory = inventoryLogs?.current_stock || 0;

    // Get sales statistics
    const totalSales = await db('orders')
      .where('status', 'completed')
      .sum('total_amount as total')
      .first();

    const monthlySales = await db('orders')
      .where('status', 'completed')
      .andWhere('created_at', '>=', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .sum('total_amount as total')
      .first();

    const stats: DashboardStats = {
      totalEmployees: parseInt(totalEmployees?.count as string) || 0,
      activeEmployees: parseInt(activeEmployees?.count as string) || 0,
      totalOrders: parseInt(totalOrders?.count as string) || 0,
      pendingOrders: parseInt(pendingOrders?.count as string) || 0,
      totalInventory: totalInventory,
      lowStockItems: totalInventory < 1000 ? 1 : 0, // Simple low stock logic
      totalSales: parseFloat(totalSales?.total as string) || 0,
      monthlySales: parseFloat(monthlySales?.total as string) || 0
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<DashboardStats>);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    } as ApiResponse);
  }
});

// Get employee statistics
router.get('/employee-stats', async (req, res) => {
  try {
    const totalEmployees = await db('employees')
      .where('status', 'active')
      .andWhere('deletion_status', 'Active')
      .count('id as count')
      .first();

    const activeEmployees = await db('employees')
      .where('status', 'active')
      .andWhere('deletion_status', 'Active')
      .andWhere('is_archived', false)
      .count('id as count')
      .first();

    // Get employees by role
    const employeesByRole = await db('employees')
      .where('status', 'active')
      .andWhere('deletion_status', 'Active')
      .select('role')
      .count('id as count')
      .groupBy('role');

    const roleStats: Record<string, number> = {};
    employeesByRole.forEach((emp: any) => {
      roleStats[emp.role] = parseInt(emp.count as string);
    });

    // Get attendance rate (simplified)
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await db('attendance_logs')
      .where('date', today)
      .count('id as count')
      .first();

    const attendanceRate = totalEmployees?.count ? 
      (parseInt(todayAttendance?.count as string) / parseInt(totalEmployees.count as string)) * 100 : 0;

    const stats: EmployeeStats = {
      totalEmployees: parseInt(totalEmployees?.count as string) || 0,
      activeEmployees: parseInt(activeEmployees?.count as string) || 0,
      employeesByRole: roleStats,
      attendanceRate: Math.round(attendanceRate),
      averageHours: 8.0 // Simplified
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<EmployeeStats>);

  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee statistics'
    } as ApiResponse);
  }
});

// Get order statistics
router.get('/order-stats', async (req, res) => {
  try {
    const totalOrders = await db('orders').count('id as count').first();
    
    const pendingOrders = await db('orders')
      .whereIn('status', ['pending_pickup', 'picked_up', 'out_for_delivery'])
      .count('id as count')
      .first();

    const completedOrders = await db('orders')
      .where('status', 'completed')
      .count('id as count')
      .first();

    // Get orders by type
    const ordersByType = await db('orders')
      .select('order_type')
      .count('id as count')
      .groupBy('order_type');

    const typeStats: Record<string, number> = {};
    ordersByType.forEach((order: any) => {
      typeStats[order.order_type] = parseInt(order.count as string);
    });

    // Get revenue statistics
    const totalRevenue = await db('orders')
      .where('status', 'completed')
      .sum('total_amount as total')
      .first();

    const monthlyRevenue = await db('orders')
      .where('status', 'completed')
      .andWhere('created_at', '>=', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .sum('total_amount as total')
      .first();

    const stats: OrderStats = {
      totalOrders: parseInt(totalOrders?.count as string) || 0,
      pendingOrders: parseInt(pendingOrders?.count as string) || 0,
      completedOrders: parseInt(completedOrders?.count as string) || 0,
      ordersByType: typeStats,
      totalRevenue: parseFloat(totalRevenue?.total as string) || 0,
      monthlyRevenue: parseFloat(monthlyRevenue?.total as string) || 0
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<OrderStats>);

  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    } as ApiResponse);
  }
});

// Get inventory statistics
router.get('/inventory-stats', async (req, res) => {
  try {
    // Get current stock
    const latestLog = await db('inventory_logs')
      .orderBy('created_at', 'desc')
      .first();

    const totalStock = latestLog?.current_stock || 0;

    // Get recent movements
    const recentMovements = await db('inventory_logs')
      .orderBy('created_at', 'desc')
      .limit(10);

    const stats: InventoryStats = {
      totalStock: totalStock,
      lowStockItems: totalStock < 1000 ? 1 : 0,
      stockByType: {
        'water_sachets': totalStock
      },
      recentMovements: recentMovements
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<InventoryStats>);

  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory statistics'
    } as ApiResponse);
  }
});

export default router;
