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
  InputAdornment,
  Autocomplete,
  FormControlLabel as MuiFormControlLabel,
  Checkbox,
  FormGroup,
  LinearProgress,
  Badge,
  Avatar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Print,
  Download,
  Upload,
  CheckCircle,
  Cancel,
  Pending,
  Inventory,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircleOutline,
  Remove,
  AddCircle,
  RemoveCircle,
  Assessment,
  History,
  LocalShipping,
  Business,
  Person,
  AttachMoney,
  Receipt,
  ShoppingCart,
  Schedule,
  Refresh,
  Save,
  Close
} from '@mui/icons-material';
import axios from 'axios';

interface InventoryManagementProps {
  selectedSection: string;
  userRole?: string;
}

interface InventoryItem {
  id: number;
  product_name: string;
  product_type: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit: string;
  unit_price: number;
  total_value: number;
  last_updated: string;
  supplier: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  notes?: string;
}

interface InventoryLog {
  id: number;
  product_id: number;
  product_name: string;
  operation_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  unit: string;
  reason: string;
  reference_number?: string;
  performed_by: string;
  timestamp: string;
  notes?: string;
  previous_stock: number;
  new_stock: number;
}

interface StockAdjustment {
  product_id: number;
  product_name: string;
  adjustment_type: 'add' | 'remove' | 'set';
  quantity: number;
  reason: string;
  notes?: string;
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [logProductFilter, setLogProductFilter] = useState('all');
  const [logOperationFilter, setLogOperationFilter] = useState('all');
  const [logDateFilter, setLogDateFilter] = useState('all');
  const [newAdjustment, setNewAdjustment] = useState<StockAdjustment>({
    product_id: 0,
    product_name: '',
    adjustment_type: 'add',
    quantity: 0,
    reason: '',
    notes: ''
  });

  const productTypes = [
    'Sachet Water',
    'Water Bottles',
    'Packaging Materials',
    'Cleaning Supplies',
    'Equipment Parts',
    'Office Supplies'
  ];

  const adjustmentReasons = [
    'Stock Count',
    'Damaged Goods',
    'Expired Products',
    'Theft/Loss',
    'Transfer',
    'Purchase',
    'Sale',
    'Return',
    'Other'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to fetch real inventory data from API
      try {
        const [statsResponse, logsResponse] = await Promise.all([
          axios.get('/api/inventory/stats'),
          axios.get('/api/inventory/logs?limit=100')
        ]);

        if (statsResponse.data.success && logsResponse.data.success) {
          // Process inventory logs to get current stock
          const logs = logsResponse.data.data;
          const totalInventory = statsResponse.data.data.totalInventory || 0;
          const inventoryByType = statsResponse.data.data.inventoryByType || [];
          
          // Create inventory items from stats
          const inventoryItems: InventoryItem[] = [];
          
          // Process each product type
          inventoryByType.forEach((product: any, index: number) => {
            inventoryItems.push({
              id: index + 1,
              product_name: product.product_name || 'Sachet Water',
              product_type: product.product_name || 'Sachet Water',
              current_stock: product.total || 0,
              minimum_stock: 200,
              maximum_stock: 10000,
              unit: 'bags',
              unit_price: 300,
              total_value: (product.total || 0) * 300,
              last_updated: new Date().toISOString(),
              supplier: 'MatSplash Production',
              location: 'Main Warehouse',
              status: product.total > 200 ? 'in_stock' : product.total > 50 ? 'low_stock' : 'out_of_stock',
              notes: 'Tracked via packing logs and order pickups'
            });
          });
          
          // If no products, create a default entry for Sachet Water
          if (inventoryItems.length === 0) {
            inventoryItems.push({
              id: 1,
              product_name: 'Sachet Water',
              product_type: 'Sachet Water',
              current_stock: totalInventory,
              minimum_stock: 200,
              maximum_stock: 10000,
              unit: 'bags',
              unit_price: 300,
              total_value: totalInventory * 300,
              last_updated: new Date().toISOString(),
              supplier: 'MatSplash Production',
              location: 'Main Warehouse',
              status: totalInventory > 200 ? 'in_stock' : totalInventory > 50 ? 'low_stock' : 'out_of_stock',
              notes: 'Tracked via packing logs and order pickups'
            });
          }

          // Map logs to match the expected interface
          const mappedLogs = logs.map((log: any) => ({
            id: log.id,
            product_id: 1, // We only have one product
            product_name: log.product_name || 'Sachet Water',
            operation_type: log.operation_type || 'adjustment',
            quantity: Math.abs(log.quantity_change || 0),
            unit: 'bags',
            reason: log.reason || 'No reason provided',
            reference_number: log.order_number || undefined,
            performed_by: 'System',
            timestamp: log.created_at,
            notes: log.notes,
            previous_stock: (log.current_stock || 0) - (log.quantity_change || 0),
            new_stock: log.current_stock || 0
          }));

          setInventory(inventoryItems);
          setInventoryLogs(mappedLogs);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        setInventory([]);
        setInventoryLogs([]);
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

  const handleOpenDialog = (type: string, item?: InventoryItem) => {
    setDialogType(type);
    setSelectedItem(item || null);
    if (type === 'adjust') {
      setNewAdjustment({
        product_id: item?.id || 0,
        product_name: item?.product_name || '',
        adjustment_type: 'add',
        quantity: 0,
        reason: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedItem(null);
    setNewAdjustment({
      product_id: 0,
      product_name: '',
      adjustment_type: 'add',
      quantity: 0,
      reason: '',
      notes: ''
    });
  };

  const handleStockAdjustment = async () => {
    if (!newAdjustment.product_id || !newAdjustment.quantity || !newAdjustment.reason) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const adjustmentData = {
        product_id: newAdjustment.product_id,
        adjustment_type: newAdjustment.adjustment_type,
        quantity: newAdjustment.quantity,
        reason: newAdjustment.reason,
        notes: newAdjustment.notes,
        performed_by: 1 // This should come from auth context
      };

      console.log('Creating stock adjustment:', adjustmentData);
      
      // Make API call to create the adjustment
      const response = await axios.post('/api/inventory/adjustments', adjustmentData);
      
      if (response.data.success) {
        // Refresh inventory data
        fetchInventoryData();
        handleCloseDialog();
        
        alert('Stock adjustment created successfully!');
      } else {
        alert('Error creating stock adjustment: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      alert('Error creating stock adjustment. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in_stock': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      case 'discontinued': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in_stock': return <CheckCircleOutline />;
      case 'low_stock': return <Warning />;
      case 'out_of_stock': return <Cancel />;
      case 'discontinued': return <Remove />;
      default: return <Inventory />;
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'in': return <AddCircle color="success" />;
      case 'out': return <RemoveCircle color="error" />;
      case 'adjustment': return <Edit color="warning" />;
      case 'transfer': return <LocalShipping color="info" />;
      default: return <Inventory />;
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.product_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const renderInventoryOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Inventory Overview
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                  <Inventory />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {inventory.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#2196f3', mr: 2 }}>
                  <CheckCircleOutline />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {inventory.filter(item => item.status === 'in_stock').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Stock
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {inventory.filter(item => item.status === 'low_stock').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
                  <Cancel />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {inventory.filter(item => item.status === 'out_of_stock').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Out of Stock
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="in_stock">In Stock</MenuItem>
                  <MenuItem value="low_stock">Low Stock</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                  <MenuItem value="discontinued">Discontinued</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Product Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Product Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {productTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Stock Level</TableCell>
                  {userRole !== 'storekeeper' && userRole !== 'receptionist' && (
                    <>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Total Value</TableCell>
                    </>
                  )}
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {item.product_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.product_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {item.current_stock} {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getStockPercentage(item.current_stock, item.maximum_stock)}
                          color={
                            item.current_stock <= item.minimum_stock ? 'error' :
                            item.current_stock <= item.minimum_stock * 1.5 ? 'warning' : 'success'
                          }
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Min: {item.minimum_stock} | Max: {item.maximum_stock}
                      </Typography>
                    </TableCell>
                    {userRole !== 'storekeeper' && userRole !== 'receptionist' && (
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ₦{item.unit_price.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ₦{item.total_value.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Chip 
                        label={item.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(item.status) as any}
                        size="small"
                        icon={getStatusIcon(item.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view', item)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {(userRole === 'storekeeper' || userRole === 'manager' || userRole === 'director' || userRole === 'admin') && (
                        <Tooltip title="Adjust Stock">
                          <IconButton size="small" onClick={() => handleOpenDialog('adjust', item)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View History">
                        <IconButton size="small" onClick={() => handleOpenDialog('history', item)}>
                          <History />
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

  const renderInventoryLogs = () => {
    // Filter logs based on selected filters
    const filteredLogs = inventoryLogs.filter((log) => {
      if (logProductFilter !== 'all' && log.product_name !== logProductFilter) return false;
      if (logOperationFilter !== 'all' && log.operation_type !== logOperationFilter) return false;
      if (logDateFilter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        if (logDateFilter === 'today' && logDate < today) return false;
        if (logDateFilter === 'yesterday' && (logDate < yesterday || logDate >= today)) return false;
        if (logDateFilter === 'this_week' && logDate < thisWeek) return false;
        if (logDateFilter === 'this_month' && logDate < thisMonth) return false;
      }
      return true;
    });
    
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Inventory Movement Logs
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={logProductFilter}
                    onChange={(e) => setLogProductFilter(e.target.value)}
                    label="Product"
                  >
                    <MenuItem value="all">All Products</MenuItem>
                    {Array.from(new Set(inventoryLogs.map(log => log.product_name))).map((product) => (
                      <MenuItem key={product} value={product}>
                        {product}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Operation</InputLabel>
                  <Select
                    value={logOperationFilter}
                    onChange={(e) => setLogOperationFilter(e.target.value)}
                    label="Operation"
                  >
                    <MenuItem value="all">All Operations</MenuItem>
                    <MenuItem value="add">Add</MenuItem>
                    <MenuItem value="remove">Remove</MenuItem>
                    <MenuItem value="adjust">Adjust</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={logDateFilter}
                    onChange={(e) => setLogDateFilter(e.target.value)}
                    label="Date Range"
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="yesterday">Yesterday</MenuItem>
                    <MenuItem value="this_week">This Week</MenuItem>
                    <MenuItem value="this_month">This Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => {
                    setLogProductFilter('all');
                    setLogOperationFilter('all');
                    setLogDateFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Performed By</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Stock Change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {log.product_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getOperationIcon(log.operation_type)}
                        <Typography sx={{ ml: 1, textTransform: 'capitalize' }}>
                          {log.operation_type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {log.quantity} {log.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.reference_number || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.performed_by}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.previous_stock} → {log.new_stock}
                      </Typography>
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

  const renderStockAdjustment = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Stock Adjustment
      </Typography>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={newAdjustment.product_id}
                  onChange={(e) => {
                    const productId = e.target.value as number;
                    const product = inventory.find(p => p.id === productId);
                    setNewAdjustment(prev => ({
                      ...prev,
                      product_id: productId,
                      product_name: product?.product_name || ''
                    }));
                  }}
                  label="Product"
                >
                  {inventory.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.product_name} (Current: {product.current_stock} {product.unit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Adjustment Type</InputLabel>
                <Select
                  value={newAdjustment.adjustment_type}
                  onChange={(e) => setNewAdjustment(prev => ({ ...prev, adjustment_type: e.target.value as any }))}
                  label="Adjustment Type"
                >
                  <MenuItem value="add">Add Stock</MenuItem>
                  <MenuItem value="remove">Remove Stock</MenuItem>
                  <MenuItem value="set">Set Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={newAdjustment.quantity}
                onChange={(e) => setNewAdjustment(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Reason</InputLabel>
                <Select
                  value={newAdjustment.reason}
                  onChange={(e) => setNewAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                  label="Reason"
                  required
                >
                  {adjustmentReasons.map((reason) => (
                    <MenuItem key={reason} value={reason}>
                      {reason}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={newAdjustment.notes}
                onChange={(e) => setNewAdjustment(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Save />}
                sx={{ bgcolor: '#13bbc6' }}
                disabled={!newAdjustment.product_id || !newAdjustment.quantity || !newAdjustment.reason}
              >
                Apply Adjustment
              </Button>
            </Grid>
          </Grid>
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
      case 'inventory':
      case 'inventory-audit':
        return renderInventoryOverview();
      case 'inventory-logs':
        return renderInventoryLogs();
      case 'stock-adjustment':
        return renderStockAdjustment();
      default:
        return renderInventoryOverview();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'view' && 'Product Details'}
          {dialogType === 'adjust' && 'Adjust Stock'}
          {dialogType === 'history' && 'Product History'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'view' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Details
              </Typography>
              <Typography>
                Product details view will be implemented here.
              </Typography>
            </Box>
          )}
          {dialogType === 'adjust' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Stock Adjustment
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    value={newAdjustment.product_name}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Adjustment Type</InputLabel>
                    <Select
                      value={newAdjustment.adjustment_type}
                      onChange={(e) => setNewAdjustment({...newAdjustment, adjustment_type: e.target.value})}
                    >
                      <MenuItem value="add">Add Stock</MenuItem>
                      <MenuItem value="remove">Remove Stock</MenuItem>
                      <MenuItem value="correction">Stock Correction</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={newAdjustment.quantity}
                    onChange={(e) => setNewAdjustment({...newAdjustment, quantity: parseInt(e.target.value) || 0})}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Reason</InputLabel>
                    <Select
                      value={newAdjustment.reason}
                      onChange={(e) => setNewAdjustment({...newAdjustment, reason: e.target.value})}
                      required
                    >
                      <MenuItem value="production">Production</MenuItem>
                      <MenuItem value="damage">Damage/Loss</MenuItem>
                      <MenuItem value="theft">Theft</MenuItem>
                      <MenuItem value="correction">Stock Correction</MenuItem>
                      <MenuItem value="return">Return</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={newAdjustment.notes}
                    onChange={(e) => setNewAdjustment({...newAdjustment, notes: e.target.value})}
                    multiline
                    rows={3}
                    placeholder="Additional notes about this adjustment..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          {dialogType === 'history' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Product History
              </Typography>
              {inventoryLogs.length > 0 ? (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Operation</TableCell>
                        <TableCell>Bags Added</TableCell>
                        <TableCell>Bags Removed</TableCell>
                        <TableCell>Stock After</TableCell>
                        <TableCell>Performed By</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.operation_type || 'Unknown'} 
                              color={log.operation_type === 'WATER_PRODUCTION' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {log.bags_added || 0}
                          </TableCell>
                          <TableCell>
                            {log.bags_removed || 0}
                          </TableCell>
                          <TableCell>
                            {log.current_stock || 0}
                          </TableCell>
                          <TableCell>
                            {log.performed_by_name || 'System'}
                          </TableCell>
                          <TableCell>
                            {log.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  No inventory history available for this product.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'adjust' && (
            <Button 
              variant="contained" 
              onClick={handleStockAdjustment}
              sx={{ bgcolor: '#13bbc6' }}
            >
              Apply Adjustment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryManagement;
