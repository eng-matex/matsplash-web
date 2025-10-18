import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Factory,
  Logout,
  AccountCircle,
  Dashboard as DashboardIcon,
  People,
  Inventory,
  Assignment,
  Security,
  Menu as MenuIcon,
  LocalShipping,
  Store,
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
// import { useAuth } from '../context/AuthContext';
import { DashboardStats } from '../types';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  // const { user, logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'Admin': '#f44336',
      'Director': '#9c27b0',
      'Manager': '#2196f3',
      'Receptionist': '#ff9800',
      'StoreKeeper': '#4caf50',
      'Driver': '#607d8b',
      'Driver Assistant': '#795548',
      'Packer': '#3f51b5',
      'Cleaner': '#009688',
      'Operator': '#ff5722',
      'Loader': '#673ab7',
      'Security': '#424242',
      'Sales': '#e91e63'
    };
    return colors[role] || '#757575';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Admin': <Security />,
      'Director': <AccountCircle />,
      'Manager': <DashboardIcon />,
      'Receptionist': <People />,
      'StoreKeeper': <Inventory />,
      'Driver': <Assignment />,
      'Driver Assistant': <Assignment />,
      'Packer': <Factory />,
      'Cleaner': <Factory />,
      'Operator': <Factory />,
      'Loader': <Factory />,
      'Security': <Security />,
      'Sales': <People />
    };
    return icons[role] || <AccountCircle />;
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Orders', icon: <Assignment />, path: '/orders' },
    { text: 'Employees', icon: <People />, path: '/employees' },
    { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
    { text: 'Attendance', icon: <AccessTime />, path: '/attendance' },
    { text: 'Surveillance', icon: <Security />, path: '/surveillance' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Factory sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MatSplash Factory Management
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={getRoleIcon(user?.role || '')}
              label={user?.role}
              color="secondary"
              variant="outlined"
              sx={{ 
                color: 'white',
                borderColor: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <AccountCircle sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <Factory sx={{ mr: 1 }} />
            <Typography variant="h6">MatSplash</Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Here's what's happening at your factory today.
          </Typography>
        </Box>

        {/* Dashboard Stats */}
        {loading ? (
          <Typography>Loading dashboard...</Typography>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <People color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Employees</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {stats?.totalEmployees || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.activeEmployees || 0} active
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Assignment color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Orders</Typography>
                  </Box>
                  <Typography variant="h4" color="secondary">
                    {stats?.totalOrders || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.pendingOrders || 0} pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Inventory color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Inventory</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {stats?.totalInventory || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.lowStockItems || 0} low stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DashboardIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Monthly Sales</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    ₦{(stats?.monthlySales || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total: ₦{(stats?.totalSales || 0).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Role-specific content placeholder */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Role: {user?.role}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is where role-specific dashboard content will be displayed.
            The full factory management system with all modules will be implemented here.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;
