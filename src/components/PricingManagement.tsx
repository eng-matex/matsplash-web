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
  Avatar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Switch,
  Slider,
  FormControlLabel as SwitchFormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
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
  AttachMoney,
  Receipt,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  Schedule,
  Person,
  Group,
  Work,
  Security,
  Videocam,
  Report,
  Analytics,
  DataUsage,
  Insights,
  Dashboard,
  TableChart,
  ViewList,
  ViewModule,
  Refresh,
  Save,
  Close,
  Login,
  Logout,
  Timer,
  Today,
  DateRange,
  RestartAlt,
  ExpandMore,
  ExpandLess,
  Warning,
  CheckCircleOutline,
  Remove,
  AddCircle,
  RemoveCircle,
  History,
  Notifications,
  NotificationsActive,
  NotificationsOff,
  CameraAlt,
  CameraEnhance,
  CameraRoll,
  CameraFront,
  CameraRear,
  LocationOn,
  NetworkCheck,
  Wifi,
  WifiOff,
  SignalWifi4Bar,
  SignalWifiOff,
  Storage,
  CloudUpload,
  CloudDownload,
  CloudSync,
  Inventory,
  AccessTime,
  CleaningServices,
  Engineering,
  Business,
  LocalShipping,
  PriceCheck,
  Percent,
  CurrencyExchange,
  MonetizationOn,
  AccountBalance,
  CreditCard,
  Payment,
  Store,
  Storefront,
  ShoppingBag,
  ShoppingBasket,
  LocalOffer,
  LocalGroceryStore,
  Category,
  Label,
  Tag,
  Sell,
  PointOfSale,
  ReceiptLong,
  Calculate,
  Functions,
  TrendingFlat,
  ShowChart,
  BarChart,
  PieChart
} from '@mui/icons-material';
import axios from 'axios';

interface PricingManagementProps {
  selectedSection: string;
  userRole?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  unit: string;
  base_cost: number;
  current_price: number;
  previous_price: number;
  markup_percentage: number;
  profit_margin: number;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

interface PriceHistory {
  id: number;
  product_id: number;
  product_name: string;
  old_price: number;
  new_price: number;
  change_reason: string;
  effective_date: string;
  changed_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface PricingRule {
  id: number;
  name: string;
  description: string;
  rule_type: 'markup' | 'discount' | 'promotion' | 'seasonal';
  condition: string;
  value: number;
  value_type: 'percentage' | 'fixed';
  applicable_products: number[];
  applicable_customers: string[];
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
}

interface CustomerSegment {
  id: number;
  name: string;
  description: string;
  discount_percentage: number;
  minimum_order_value: number;
  customer_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

const PricingManagement: React.FC<PricingManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: '',
    unit: 'bag',
    base_cost: 0,
    current_price: 0,
    markup_percentage: 0,
    status: 'active'
  });
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({
    name: '',
    description: '',
    rule_type: 'markup',
    condition: '',
    value: 0,
    value_type: 'percentage',
    applicable_products: [],
    applicable_customers: [],
    start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const productCategories = [
    'Sachet Water',
    'Water Bottles',
    'Water Dispensers',
    'Accessories',
    'Cleaning Supplies',
    'Packaging Materials'
  ];

  const units = [
    'bag',
    'carton',
    'bottle',
    'pack',
    'piece',
    'liter',
    'gallon'
  ];

  const ruleTypes = [
    { value: 'markup', label: 'Markup Rule' },
    { value: 'discount', label: 'Discount Rule' },
    { value: 'promotion', label: 'Promotion Rule' },
    { value: 'seasonal', label: 'Seasonal Rule' }
  ];

  const valueTypes = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount (₦)' }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for products
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Sachet Water',
          description: 'Pure water sachets',
          category: 'Sachet Water',
          unit: 'bag',
          base_cost: 100,
          current_price: 150,
          previous_price: 140,
          markup_percentage: 50,
          profit_margin: 33.33,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-15T00:00:00Z'
        },
        {
          id: 2,
          name: 'Sachet Water',
          description: 'Pure water sachets',
          category: 'Sachet Water',
          unit: 'bag',
          base_cost: 180,
          current_price: 250,
          previous_price: 240,
          markup_percentage: 38.89,
          profit_margin: 28,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-10T00:00:00Z'
        },
        {
          id: 3,
          name: 'Water Bottles (500ml)',
          description: 'Plastic water bottles, 500ml each',
          category: 'Water Bottles',
          unit: 'bottle',
          base_cost: 120,
          current_price: 200,
          previous_price: 200,
          markup_percentage: 66.67,
          profit_margin: 40,
          status: 'active',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-09-20T00:00:00Z'
        },
        {
          id: 4,
          name: 'Water Bottles (1.5L)',
          description: 'Plastic water bottles, 1.5 liters each',
          category: 'Water Bottles',
          unit: 'bottle',
          base_cost: 200,
          current_price: 350,
          previous_price: 320,
          markup_percentage: 75,
          profit_margin: 42.86,
          status: 'active',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-10-05T00:00:00Z'
        },
        {
          id: 5,
          name: 'Water Dispenser (20L)',
          description: 'Large water dispenser, 20 liters',
          category: 'Water Dispensers',
          unit: 'piece',
          base_cost: 800,
          current_price: 1200,
          previous_price: 1200,
          markup_percentage: 50,
          profit_margin: 33.33,
          status: 'active',
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-08-15T00:00:00Z'
        }
      ];

      const mockPriceHistory: PriceHistory[] = [
        {
          id: 1,
          product_id: 1,
          product_name: 'Sachet Water',
          old_price: 140,
          new_price: 150,
          change_reason: 'Increased production costs',
          effective_date: '2024-10-15',
          changed_by: 'Manager',
          approved_by: 'Director',
          status: 'approved',
          created_at: '2024-10-15T00:00:00Z'
        },
        {
          id: 2,
          product_id: 2,
          product_name: 'Sachet Water',
          old_price: 240,
          new_price: 250,
          change_reason: 'Market adjustment',
          effective_date: '2024-10-10',
          changed_by: 'Manager',
          approved_by: 'Director',
          status: 'approved',
          created_at: '2024-10-10T00:00:00Z'
        },
        {
          id: 3,
          product_id: 4,
          product_name: 'Water Bottles (1.5L)',
          old_price: 320,
          new_price: 350,
          change_reason: 'Raw material cost increase',
          effective_date: '2024-10-05',
          changed_by: 'Manager',
          status: 'pending',
          created_at: '2024-10-05T00:00:00Z'
        }
      ];

      const mockPricingRules: PricingRule[] = [
        {
          id: 1,
          name: 'Wholesale Discount',
          description: '10% discount for wholesale customers',
          rule_type: 'discount',
          condition: 'order_quantity >= 100',
          value: 10,
          value_type: 'percentage',
          applicable_products: [1, 2, 3, 4],
          applicable_customers: ['wholesale'],
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Seasonal Promotion',
          description: '5% discount during dry season',
          rule_type: 'promotion',
          condition: 'season == "dry"',
          value: 5,
          value_type: 'percentage',
          applicable_products: [1, 2],
          applicable_customers: ['all'],
          start_date: '2024-11-01',
          end_date: '2024-12-31',
          status: 'active',
          created_at: '2024-10-01T00:00:00Z',
          updated_at: '2024-10-01T00:00:00Z'
        }
      ];

      const mockCustomerSegments: CustomerSegment[] = [
        {
          id: 1,
          name: 'Wholesale Customers',
          description: 'Large volume customers',
          discount_percentage: 10,
          minimum_order_value: 50000,
          customer_count: 15,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Retail Customers',
          description: 'Small volume customers',
          discount_percentage: 0,
          minimum_order_value: 0,
          customer_count: 45,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'VIP Customers',
          description: 'Premium customers with special rates',
          discount_percentage: 15,
          minimum_order_value: 100000,
          customer_count: 8,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      setProducts(mockProducts);
      setPriceHistory(mockPriceHistory);
      setPricingRules(mockPricingRules);
      setCustomerSegments(mockCustomerSegments);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, item?: Product | PricingRule) => {
    setDialogType(type);
    if (item && 'category' in item) {
      setSelectedProduct(item as Product);
    } else if (item && 'rule_type' in item) {
      setSelectedRule(item as PricingRule);
    } else {
      setSelectedProduct(null);
      setSelectedRule(null);
    }
    
    if (type === 'new-product') {
      setNewProduct({
        name: '',
        description: '',
        category: '',
        unit: 'bag',
        base_cost: 0,
        current_price: 0,
        markup_percentage: 0,
        status: 'active'
      });
    } else if (type === 'new-rule') {
      setNewRule({
        name: '',
        description: '',
        rule_type: 'markup',
        condition: '',
        value: 0,
        value_type: 'percentage',
        applicable_products: [],
        applicable_customers: [],
        start_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedProduct(null);
    setSelectedRule(null);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setNewProduct((prev: any) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate markup percentage when base cost or current price changes
      if (name === 'base_cost' || name === 'current_price') {
        const baseCost = parseFloat(updated.base_cost) || 0;
        const currentPrice = parseFloat(updated.current_price) || 0;
        if (baseCost > 0) {
          updated.markup_percentage = ((currentPrice - baseCost) / baseCost) * 100;
          updated.profit_margin = ((currentPrice - baseCost) / currentPrice) * 100;
        }
      }
      
      return updated;
    });
  };

  const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setNewRule((prev: any) => ({ ...prev, [name]: value }));
  };

  const validateProductForm = () => {
    const errors: any = {};
    if (!newProduct.name) errors.name = 'Product name is required';
    if (!newProduct.category) errors.category = 'Category is required';
    if (!newProduct.base_cost || newProduct.base_cost <= 0) errors.base_cost = 'Base cost must be greater than 0';
    if (!newProduct.current_price || newProduct.current_price <= 0) errors.current_price = 'Current price must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRuleForm = () => {
    const errors: any = {};
    if (!newRule.name) errors.name = 'Rule name is required';
    if (!newRule.description) errors.description = 'Description is required';
    if (!newRule.value || newRule.value <= 0) errors.value = 'Value must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitProduct = async () => {
    if (!validateProductForm()) return;

    setLoading(true);
    try {
      // Here you would make API call to save product
      console.log('Saving product:', newProduct);
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      setFormErrors({ submit: 'Failed to save product. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRule = async () => {
    if (!validateRuleForm()) return;

    setLoading(true);
    try {
      // Here you would make API call to save pricing rule
      console.log('Saving pricing rule:', newRule);
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving pricing rule:', error);
      setFormErrors({ submit: 'Failed to save pricing rule. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'discontinued': return 'error';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getPriceChangeIcon = (oldPrice: number, newPrice: number) => {
    if (newPrice > oldPrice) return <TrendingUp sx={{ color: '#f44336' }} />;
    if (newPrice < oldPrice) return <TrendingDown sx={{ color: '#4caf50' }} />;
    return <TrendingFlat sx={{ color: '#666' }} />;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const renderProductsList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Product Pricing
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-product')}
          sx={{ bgcolor: '#13bbc6' }}
        >
          Add Product
        </Button>
      </Box>

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
                    {products.filter(p => p.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Products
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
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    ₦{products.reduce((sum, p) => sum + p.current_price, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Product Value
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
                  <Percent />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {products.length > 0 ? (products.reduce((sum, p) => sum + p.profit_margin, 0) / products.length).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Profit Margin
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
                <Avatar sx={{ bgcolor: '#9c27b0', mr: 2 }}>
                  <PriceCheck />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {priceHistory.filter(h => h.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Price Changes
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
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {productCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="discontinued">Discontinued</MenuItem>
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
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Base Cost</TableCell>
                  <TableCell>Current Price</TableCell>
                  <TableCell>Markup %</TableCell>
                  <TableCell>Profit Margin</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={product.category} 
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ₦{product.base_cost.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold">
                          ₦{product.current_price.toLocaleString()}
                        </Typography>
                        {product.current_price !== product.previous_price && (
                          <Box sx={{ ml: 1 }}>
                            {getPriceChangeIcon(product.previous_price, product.current_price)}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.markup_percentage.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.profit_margin.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={product.status.charAt(0).toUpperCase() + product.status.slice(1)} 
                        color={getStatusColor(product.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-product', product)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Product">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-product', product)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Price History">
                        <IconButton size="small" onClick={() => handleOpenDialog('price-history', product)}>
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

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (selectedSection) {
      case 'pricing':
        return renderProductsList();
      default:
        return renderProductsList();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new-product' && 'Add New Product'}
          {dialogType === 'edit-product' && 'Edit Product'}
          {dialogType === 'view-product' && 'Product Details'}
          {dialogType === 'price-history' && 'Price History'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'new-product' && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Product Name"
                    name="name"
                    fullWidth
                    value={newProduct.name}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined" error={!!formErrors.category}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={newProduct.category}
                      onChange={handleProductChange}
                      label="Category"
                    >
                      {productCategories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    name="description"
                    fullWidth
                    multiline
                    rows={2}
                    value={newProduct.description}
                    onChange={handleProductChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Unit</InputLabel>
                    <Select
                      name="unit"
                      value={newProduct.unit}
                      onChange={handleProductChange}
                      label="Unit"
                    >
                      {units.map((unit) => (
                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={newProduct.status}
                      onChange={handleProductChange}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="discontinued">Discontinued</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Base Cost (₦)"
                    name="base_cost"
                    type="number"
                    fullWidth
                    value={newProduct.base_cost}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.base_cost}
                    helperText={formErrors.base_cost}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Current Price (₦)"
                    name="current_price"
                    type="number"
                    fullWidth
                    value={newProduct.current_price}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.current_price}
                    helperText={formErrors.current_price}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Markup Percentage (%)"
                    name="markup_percentage"
                    type="number"
                    fullWidth
                    value={newProduct.markup_percentage}
                    onChange={handleProductChange}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Profit Margin (%)"
                    name="profit_margin"
                    type="number"
                    fullWidth
                    value={newProduct.profit_margin}
                    onChange={handleProductChange}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
              {formErrors.submit && <Alert severity="error" sx={{ mt: 2 }}>{formErrors.submit}</Alert>}
            </Box>
          )}
          {dialogType === 'view-product' && selectedProduct && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Product Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Name:</strong> {selectedProduct.name}</Typography>
                  <Typography variant="body2"><strong>Category:</strong> {selectedProduct.category}</Typography>
                  <Typography variant="body2"><strong>Unit:</strong> {selectedProduct.unit}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {selectedProduct.status}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Base Cost:</strong> ₦{selectedProduct.base_cost.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Current Price:</strong> ₦{selectedProduct.current_price.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Markup:</strong> {selectedProduct.markup_percentage.toFixed(1)}%</Typography>
                  <Typography variant="body2"><strong>Profit Margin:</strong> {selectedProduct.profit_margin.toFixed(1)}%</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Description:</strong> {selectedProduct.description}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new-product' && (
            <Button variant="contained" onClick={handleSubmitProduct} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Add Product'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PricingManagement;
