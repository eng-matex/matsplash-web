import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment
} from '@mui/material';
import {
  PointOfSale,
  Assessment,
  AccessTime,
  CheckCircle,
  Warning,
  Add,
  Edit,
  Delete,
  Visibility,
  History,
  TrendingUp,
  Person,
  AttachMoney,
  Receipt,
  ShoppingCart,
  Business,
  LocalShipping
} from '@mui/icons-material';
import axios from 'axios';

interface SalesDashboardProps {
  selectedSection: string;
}

const SalesDashboard: React.FC<SalesDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [salesEntries, setSalesEntries] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newSale, setNewSale] = useState({
    customer_name: '',
    customer_phone: '',
    product_type: '',
    quantity: 0,
    unit_price: 0,
    total_amount: 0,
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      switch (selectedSection) {
        case 'overview':
          // Mock sales data
          setSalesEntries([
            {
              id: 1,
              sale_number: 'SALE001',
              customer_name: 'John Doe',
              customer_phone: '08012345678',
              product_type: 'Water Sachets (500ml)',
              quantity: 50,
              unit_price: 300,
              total_amount: 15000,
              payment_method: 'cash',
              status: 'completed',
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              sale_number: 'SALE002',
              customer_name: 'Jane Smith',
              customer_phone: '08087654321',
              product_type: 'Water Sachets (1L)',
              quantity: 30,
              unit_price: 500,
              total_amount: 15000,
              payment_method: 'transfer',
              status: 'pending',
              created_at: new Date(Date.now() - 3600000).toISOString()
            }
          ]);
          break;
        case 'sales-entry':
          // Mock products data
          setProducts([
            { id: 1, name: 'Water Sachets (500ml)', price: 300, unit: 'bags', stock: 1000 },
            { id: 2, name: 'Water Sachets (1L)', price: 500, unit: 'bags', stock: 500 },
            { id: 3, name: 'Water Bottles (500ml)', price: 200, unit: 'bottles', stock: 200 }
          ]);
          break;
        case 'sales-history':
          // Mock sales history data
          setSalesHistory([
            {
              id: 1,
              sale_number: 'SALE001',
              customer_name: 'John Doe',
              product_type: 'Water Sachets (500ml)',
              quantity: 50,
              total_amount: 15000,
              payment_method: 'cash',
              status: 'completed',
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              sale_number: 'SALE002',
              customer_name: 'Jane Smith',
              product_type: 'Water Sachets (1L)',
              quantity: 30,
              total_amount: 15000,
              payment_method: 'transfer',
              status: 'completed',
              created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 3,
              sale_number: 'SALE003',
              customer_name: 'Mike Johnson',
              product_type: 'Water Bottles (500ml)',
              quantity: 100,
              total_amount: 20000,
              payment_method: 'cash',
              status: 'completed',
              created_at: new Date(Date.now() - 86400000).toISOString()
            }
          ]);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, item?: any) => {
    setDialogType(type);
    setSelectedItem(item || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedItem(null);
    setNewSale({
      customer_name: '',
      customer_phone: '',
      product_type: '',
      quantity: 0,
      unit_price: 0,
      total_amount: 0,
      payment_method: 'cash',
      notes: ''
    });
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      setNewSale({
        ...newSale,
        product_type: product.name,
        unit_price: product.price,
        total_amount: newSale.quantity * product.price
      });
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setNewSale({
      ...newSale,
      quantity,
      total_amount: quantity * newSale.unit_price
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return <AttachMoney />;
      case 'transfer': return <Receipt />;
      case 'card': return <ShoppingCart />;
      default: return <AttachMoney />;
    }
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Sales Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PointOfSale sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Today's Sales</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {salesEntries.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Today's Revenue</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                ₦{salesEntries.reduce((sum, sale) => sum + sale.total_amount, 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: '#FFD700' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Monthly Sales</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
                {salesHistory.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Active Customers</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                {new Set(salesHistory.map(s => s.customer_name)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Recent Sales
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sale ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesEntries.slice(0, 5).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.sale_number}</TableCell>
                        <TableCell>{sale.customer_name}</TableCell>
                        <TableCell>₦{sale.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={sale.status} 
                            color={getStatusColor(sale.status) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('new-sale')}
                  sx={{ bgcolor: '#13bbc6' }}
                  className="dashboard-button"
                >
                  New Sale Entry
                </Button>
                <Button
                  variant="contained"
                  startIcon={<History />}
                  onClick={() => handleOpenDialog('view-history')}
                  sx={{ bgcolor: '#4caf50' }}
                  className="dashboard-button"
                >
                  View Sales History
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Assessment />}
                  onClick={() => handleOpenDialog('sales-report')}
                  sx={{ bgcolor: '#FFD700', color: '#000' }}
                  className="dashboard-button"
                >
                  Generate Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSalesEntry = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Sales Entry
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-sale')}
          sx={{ bgcolor: '#13bbc6' }}
          className="dashboard-button"
        >
          New Sale
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            Quick Sale Entry Form
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={newSale.customer_name}
                onChange={(e) => setNewSale({ ...newSale, customer_name: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Phone"
                value={newSale.customer_phone}
                onChange={(e) => setNewSale({ ...newSale, customer_phone: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Product Type</InputLabel>
                <Select
                  value={newSale.product_type}
                  onChange={(e) => handleProductChange(e.target.value)}
                  label="Product Type"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id.toString()}>
                      {product.name} - ₦{product.price} ({product.stock} in stock)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={newSale.quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={newSale.unit_price}
                onChange={(e) => setNewSale({ ...newSale, unit_price: parseFloat(e.target.value) || 0 })}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₦</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Amount"
                value={newSale.total_amount}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₦</InputAdornment>,
                  readOnly: true
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={newSale.payment_method}
                  onChange={(e) => setNewSale({ ...newSale, payment_method: e.target.value })}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="transfer">Bank Transfer</MenuItem>
                  <MenuItem value="card">Card Payment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={newSale.notes}
                onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CheckCircle />}
                sx={{ bgcolor: '#4caf50' }}
                className="dashboard-button"
              >
                Process Sale
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderSalesHistory = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Sales History
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Sales" />
            <Tab label="Today" />
            <Tab label="This Week" />
            <Tab label="This Month" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sale ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesHistory.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.sale_number}</TableCell>
                    <TableCell>{sale.customer_name}</TableCell>
                    <TableCell>{sale.product_type}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>₦{sale.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getPaymentMethodIcon(sale.payment_method)}
                        <Typography sx={{ ml: 1 }}>
                          {sale.payment_method.toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.status} 
                        color={getStatusColor(sale.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-sale', sale)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Receipt">
                        <IconButton size="small" onClick={() => handleOpenDialog('print-receipt', sale)}>
                          <Receipt />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (selectedSection) {
      case 'overview':
        return renderOverview();
      case 'sales-entry':
        return renderSalesEntry();
      case 'sales-history':
        return renderSalesHistory();
      default:
        return renderOverview();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new-sale' && 'New Sale Entry'}
          {dialogType === 'view-sale' && 'Sale Details'}
          {dialogType === 'print-receipt' && 'Print Receipt'}
          {dialogType === 'view-history' && 'Sales History'}
          {dialogType === 'sales-report' && 'Sales Report'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType.includes('sale') && 'Sale management functionality will be implemented here.'}
            {dialogType.includes('receipt') && 'Receipt printing functionality will be implemented here.'}
            {dialogType.includes('report') && 'Sales reporting functionality will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new-sale' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              Process Sale
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesDashboard;
