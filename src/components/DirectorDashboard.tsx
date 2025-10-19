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
    alerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API calls for dashboard data
      const mockData = {
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
        alerts: 2
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Sales Performance
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Assessment sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Sales Chart
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interactive chart showing sales trends over time
                  </Typography>
                </Box>
              </Box>
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
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    System Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ color: '#4caf50', mr: 1 }} />
                    <Typography variant="body1">All Systems Operational</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Warning sx={{ color: '#ff9800', mr: 1 }} />
                    <Typography variant="body1">{dashboardData.pendingTasks} Pending Tasks</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Error sx={{ color: '#f44336', mr: 1 }} />
                    <Typography variant="body1">{dashboardData.alerts} Alerts</Typography>
                  </Box>
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
