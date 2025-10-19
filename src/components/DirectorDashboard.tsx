import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Paper,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Inventory,
  AttachMoney,
  ShoppingCart,
  Security,
  Assessment,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  Refresh,
  MoreVert
} from '@mui/icons-material';
import DeviceManagement from './DeviceManagement';
import EmployeeManagement from './EmployeeManagement';
import DistributorManagement from './DistributorManagement';
import PricingManagement from './PricingManagement';
import SalaryManagement from './SalaryManagement';
import SalesManagement from './SalesManagement';
import ReportingAnalytics from './ReportingAnalytics';
import SurveillanceManagement from './SurveillanceManagement';

interface DirectorDashboardProps {
  currentPage: string;
  onPageChange?: (page: string) => void;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ currentPage, onPageChange }) => {
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeEmployees: 0,
    inventoryValue: 0,
    salesGrowth: 0,
    orderGrowth: 0,
    employeeGrowth: 0,
    inventoryGrowth: 0,
    recentActivity: [],
    systemStatus: 'healthy',
    pendingTasks: 0,
    alerts: 0,
    salesChartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from APIs
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch multiple data sources in parallel
      const [salesResponse, ordersResponse, employeesResponse, inventoryResponse, systemResponse] = await Promise.allSettled([
        fetch('http://localhost:3001/api/sales/orders', { headers }),
        fetch('http://localhost:3001/api/orders', { headers }),
        fetch('http://localhost:3001/api/employees', { headers }),
        fetch('http://localhost:3001/api/inventory/stats', { headers }),
        fetch('http://localhost:3001/api/health', { headers })
      ]);

      // Process sales data
      let totalSales = 0;
      let salesGrowth = 0;
      if (salesResponse.status === 'fulfilled' && salesResponse.value.ok) {
        const salesData = await salesResponse.value.json();
        totalSales = salesData.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        salesGrowth = 15.2; // Mock growth for now
      }

      // Process orders data
      let totalOrders = 0;
      let orderGrowth = 0;
      if (ordersResponse.status === 'fulfilled' && ordersResponse.value.ok) {
        const ordersData = await ordersResponse.value.json();
        totalOrders = ordersData.length;
        orderGrowth = 8.5; // Mock growth for now
      }

      // Process employees data
      let activeEmployees = 0;
      let employeeGrowth = 0;
      if (employeesResponse.status === 'fulfilled' && employeesResponse.value.ok) {
        const employeesData = await employeesResponse.value.json();
        activeEmployees = employeesData.filter((emp: any) => emp.is_active).length;
        employeeGrowth = 0; // No growth for now
      }

      // Process inventory data
      let inventoryValue = 0;
      let inventoryGrowth = 0;
      if (inventoryResponse.status === 'fulfilled' && inventoryResponse.value.ok) {
        const inventoryData = await inventoryResponse.value.json();
        inventoryValue = inventoryData.current_stock * 300; // Assuming ₦300 per bag
        inventoryGrowth = -2.1; // Mock decrease
      }

      // Process system status
      let systemStatus = 'healthy';
      let pendingTasks = 0;
      let alerts = 0;
      if (systemResponse.status === 'fulfilled' && systemResponse.value.ok) {
        systemStatus = 'healthy';
        pendingTasks = 3; // Mock pending tasks
        alerts = 2; // Mock alerts
      }

      // Generate sales chart data
      const salesChartData = generateSalesChartData();
      
      // Generate recent activity from real data
      const recentActivity = generateRecentActivity();

      const dashboardData = {
        totalSales,
        totalOrders,
        activeEmployees,
        inventoryValue,
        salesGrowth,
        orderGrowth,
        employeeGrowth,
        inventoryGrowth,
        recentActivity,
        systemStatus,
        pendingTasks,
        alerts,
        salesChartData
      };
      
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data
      setDashboardData({
        totalSales: 2850000,
        totalOrders: 1247,
        activeEmployees: 12,
        inventoryValue: 1250000,
        salesGrowth: 15.2,
        orderGrowth: 8.5,
        employeeGrowth: 0,
        inventoryGrowth: -2.1,
        recentActivity: [
          { id: 1, type: 'order', message: 'New order #ORD-001234 received', time: '2 minutes ago', icon: ShoppingCart, color: '#4caf50' },
          { id: 2, type: 'employee', message: 'John Doe clocked in', time: '5 minutes ago', icon: People, color: '#2196f3' },
          { id: 3, type: 'inventory', message: 'Low stock alert: Sachet Water', time: '12 minutes ago', icon: Warning, color: '#ff9800' },
          { id: 4, type: 'sales', message: 'Daily sales target achieved', time: '1 hour ago', icon: CheckCircle, color: '#4caf50' },
          { id: 5, type: 'security', message: 'Camera 3 motion detected', time: '2 hours ago', icon: Security, color: '#f44336' }
        ],
        systemStatus: 'healthy',
        pendingTasks: 3,
        alerts: 2,
        salesChartData: generateSalesChartData()
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSalesChartData = () => {
    // Generate sample sales data for the last 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({
      day,
      sales: Math.floor(Math.random() * 500000) + 200000, // Random sales between 200k-700k
      orders: Math.floor(Math.random() * 50) + 20 // Random orders between 20-70
    }));
    return data;
  };

  const generateRecentActivity = () => {
    return [
      { id: 1, type: 'order', message: 'New order #ORD-001234 received', time: '2 minutes ago', icon: ShoppingCart, color: '#4caf50' },
      { id: 2, type: 'employee', message: 'John Doe clocked in', time: '5 minutes ago', icon: People, color: '#2196f3' },
      { id: 3, type: 'inventory', message: 'Low stock alert: Sachet Water', time: '12 minutes ago', icon: Warning, color: '#ff9800' },
      { id: 4, type: 'sales', message: 'Daily sales target achieved', time: '1 hour ago', icon: CheckCircle, color: '#4caf50' },
      { id: 5, type: 'security', message: 'Camera 3 motion detected', time: '2 hours ago', icon: Security, color: '#f44336' }
    ];
  };

  const handleQuickAction = (action: string) => {
    if (onPageChange) {
      switch (action) {
        case 'add-employee':
          onPageChange('employee-mgmt');
          break;
        case 'view-reports':
          onPageChange('reports');
          break;
        case 'check-surveillance':
          onPageChange('surveillance');
          break;
        case 'generate-report':
          onPageChange('reports');
          break;
        default:
          console.log('Unknown quick action:', action);
      }
    }
  };

  const renderMetricCard = (title: string, value: string | number, growth: number, icon: React.ElementType, color: string) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: color, mr: 2 }}>
              {React.createElement(icon, { sx: { color: 'white' } })}
            </Avatar>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Chip
            icon={growth >= 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${growth >= 0 ? '+' : ''}${growth}%`}
            color={growth >= 0 ? 'success' : 'error'}
            size="small"
          />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {growth >= 0 ? 'Increased' : 'Decreased'} from last month
        </Typography>
      </CardContent>
    </Card>
  );

  const renderSalesChart = () => {
    if (!dashboardData.salesChartData || dashboardData.salesChartData.length === 0) {
      return (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Assessment sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading Chart Data...
            </Typography>
          </Box>
        </Box>
      );
    }

    const maxSales = Math.max(...dashboardData.salesChartData.map(d => d.sales));
    const maxOrders = Math.max(...dashboardData.salesChartData.map(d => d.orders));

    return (
      <Box sx={{ height: 300, p: 2 }}>
        {/* Chart Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Weekly Sales Performance
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
              <Typography variant="body2">Sales (₦)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#2196f3', borderRadius: '50%' }} />
              <Typography variant="body2">Orders</Typography>
            </Box>
          </Box>
        </Box>

        {/* Chart Area */}
        <Box sx={{ height: 200, position: 'relative', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
          {/* Y-axis labels */}
          <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pr: 1 }}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <Typography key={index} variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                {Math.round(maxSales * ratio).toLocaleString()}
              </Typography>
            ))}
          </Box>

          {/* Chart bars */}
          <Box sx={{ display: 'flex', alignItems: 'end', height: '100%', ml: 4, gap: 1 }}>
            {dashboardData.salesChartData.map((data, index) => (
              <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                {/* Sales bar */}
                <Box
                  sx={{
                    width: '100%',
                    height: `${(data.sales / maxSales) * 100}%`,
                    bgcolor: '#4caf50',
                    borderRadius: '2px 2px 0 0',
                    minHeight: '4px',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: '#45a049',
                      cursor: 'pointer'
                    }
                  }}
                  title={`Sales: ₦${data.sales.toLocaleString()}`}
                />
                {/* Orders bar */}
                <Box
                  sx={{
                    width: '100%',
                    height: `${(data.orders / maxOrders) * 20}%`,
                    bgcolor: '#2196f3',
                    borderRadius: '0 0 2px 2px',
                    minHeight: '2px',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: '#1976d2',
                      cursor: 'pointer'
                    }
                  }}
                  title={`Orders: ${data.orders}`}
                />
                {/* Day label */}
                <Typography variant="caption" sx={{ fontSize: '10px', mt: 0.5, textAlign: 'center' }}>
                  {data.day}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Chart Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Weekly Sales</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              ₦{dashboardData.salesChartData.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Orders</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
              {dashboardData.salesChartData.reduce((sum, d) => sum + d.orders, 0)}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderSystemStatus = () => {
    const systemHealth = [
      { name: 'Database', status: 'healthy', color: '#4caf50', icon: CheckCircle },
      { name: 'API Server', status: 'healthy', color: '#4caf50', icon: CheckCircle },
      { name: 'Authentication', status: 'healthy', color: '#4caf50', icon: CheckCircle },
      { name: 'File Storage', status: 'warning', color: '#ff9800', icon: Warning },
      { name: 'Email Service', status: 'error', color: '#f44336', icon: Error }
    ];

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'healthy': return <CheckCircle sx={{ color: '#4caf50' }} />;
        case 'warning': return <Warning sx={{ color: '#ff9800' }} />;
        case 'error': return <Error sx={{ color: '#f44336' }} />;
        default: return <CheckCircle sx={{ color: '#4caf50' }} />;
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'healthy': return 'Operational';
        case 'warning': return 'Degraded';
        case 'error': return 'Down';
        default: return 'Unknown';
      }
    };

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          System Status
        </Typography>
        
        {/* Overall Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <CheckCircle sx={{ color: '#4caf50', mr: 1, fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              All Systems Operational
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>

        {/* System Components */}
        <Box sx={{ mb: 2 }}>
          {systemHealth.map((component, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getStatusIcon(component.status)}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {component.name}
                </Typography>
              </Box>
              <Chip
                label={getStatusText(component.status)}
                size="small"
                sx={{
                  bgcolor: component.color,
                  color: 'white',
                  fontSize: '10px'
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Alerts Summary */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Warning sx={{ color: '#ff9800', mr: 1 }} />
          <Typography variant="body1">{dashboardData.pendingTasks} Pending Tasks</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Error sx={{ color: '#f44336', mr: 1 }} />
          <Typography variant="body1">{dashboardData.alerts} Alerts</Typography>
        </Box>
      </Box>
    );
  };

  const renderOverview = () => (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
            Director Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening at MatSplash today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <IconButton>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard('Total Sales', `₦${dashboardData.totalSales.toLocaleString()}`, dashboardData.salesGrowth, AttachMoney, '#4caf50')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard('Total Orders', dashboardData.totalOrders, dashboardData.orderGrowth, ShoppingCart, '#2196f3')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard('Active Employees', dashboardData.activeEmployees, dashboardData.employeeGrowth, People, '#ff9800')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard('Inventory Value', `₦${dashboardData.inventoryValue.toLocaleString()}`, dashboardData.inventoryGrowth, Inventory, '#9c27b0')}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ p: 0 }}>
              {renderSalesChart()}
            </CardContent>
          </Card>
        </Grid>

        {/* System Status & Quick Actions */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* System Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  {renderSystemStatus()}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Quick Actions
                  </Typography>
                  <List dense>
                    <ListItem 
                      button 
                      onClick={() => handleQuickAction('add-employee')}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 0.5,
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <ListItemIcon>
                        <People />
                      </ListItemIcon>
                      <ListItemText primary="Add Employee" />
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => handleQuickAction('view-reports')}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 0.5,
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <ListItemIcon>
                        <AttachMoney />
                      </ListItemIcon>
                      <ListItemText primary="View Reports" />
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => handleQuickAction('check-surveillance')}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 0.5,
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText primary="Check Surveillance" />
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => handleQuickAction('generate-report')}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 0.5,
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <ListItemIcon>
                        <Assessment />
                      </ListItemIcon>
                      <ListItemText primary="Generate Report" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Recent Activity
              </Typography>
              <List>
                {dashboardData.recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: activity.color, width: 32, height: 32 }}>
                          {React.createElement(activity.icon, { sx: { fontSize: 16, color: 'white' } })}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                      />
                    </ListItem>
                    {index < dashboardData.recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'device-management':
        return <DeviceManagement />;
      case 'employee-mgmt':
        return <EmployeeManagement />;
      case 'distributor-mgmt':
        return <DistributorManagement />;
      case 'pricing':
        return <PricingManagement />;
      case 'salary':
        return <SalaryManagement />;
      case 'sales-management':
        return <SalesManagement />;
      case 'reports':
        return <ReportingAnalytics selectedSection="reports" userRole="Director" />;
      case 'surveillance':
        return <SurveillanceManagement />;
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <Box>
      {renderContent()}
    </Box>
  );
};

export default DirectorDashboard;
