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
  Assessment,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  ShowChart,
  Timeline,
  Schedule,
  Person,
  Group,
  AttachMoney,
  Receipt,
  ShoppingCart,
  Inventory,
  AccessTime,
  Security,
  Videocam,
  Business,
  LocalShipping,
  Work,
  CleaningServices,
  Engineering,
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
  CloudSync
} from '@mui/icons-material';
import axios from 'axios';

interface ReportingAnalyticsProps {
  selectedSection: string;
  userRole?: string;
}

interface ReportData {
  id: number;
  title: string;
  type: 'sales' | 'inventory' | 'attendance' | 'orders' | 'employees' | 'surveillance' | 'financial';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  generated_at: string;
  generated_by: string;
  status: 'completed' | 'processing' | 'failed';
  file_path?: string;
  summary: {
    total_records: number;
    key_metrics: Record<string, number>;
    insights: string[];
  };
}

interface AnalyticsMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: string;
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

const ReportingAnalytics: React.FC<ReportingAnalyticsProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  const reportTypes = [
    { value: 'sales', label: 'Sales Reports' },
    { value: 'inventory', label: 'Inventory Reports' },
    { value: 'attendance', label: 'Attendance Reports' },
    { value: 'orders', label: 'Order Reports' },
    { value: 'employees', label: 'Employee Reports' },
    { value: 'surveillance', label: 'Surveillance Reports' },
    { value: 'financial', label: 'Financial Reports' }
  ];

  const reportPeriods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for reports
      const mockReports: ReportData[] = [
        {
          id: 1,
          title: 'Monthly Sales Report - October 2024',
          type: 'sales',
          period: 'monthly',
          generated_at: new Date().toISOString(),
          generated_by: 'Manager',
          status: 'completed',
          file_path: '/reports/sales_october_2024.pdf',
          summary: {
            total_records: 150,
            key_metrics: {
              total_sales: 2500000,
              total_orders: 150,
              average_order_value: 16667,
              top_product: 45
            },
            insights: [
              'Sales increased by 15% compared to last month',
              'Peak sales day was October 15th',
              'Water sachets (500ml) were the top-selling product'
            ]
          }
        },
        {
          id: 2,
          title: 'Weekly Inventory Report - Week 42',
          type: 'inventory',
          period: 'weekly',
          generated_at: new Date(Date.now() - 86400000).toISOString(),
          generated_by: 'Storekeeper',
          status: 'completed',
          file_path: '/reports/inventory_week42_2024.pdf',
          summary: {
            total_records: 25,
            key_metrics: {
              total_products: 25,
              low_stock_items: 3,
              out_of_stock_items: 1,
              total_value: 1250000
            },
            insights: [
              '3 items are running low on stock',
              '1 item is completely out of stock',
              'Inventory value increased by 8% this week'
            ]
          }
        },
        {
          id: 3,
          title: 'Daily Attendance Report - Today',
          type: 'attendance',
          period: 'daily',
          generated_at: new Date().toISOString(),
          generated_by: 'Manager',
          status: 'processing',
          summary: {
            total_records: 12,
            key_metrics: {
              total_employees: 12,
              present_today: 10,
              late_today: 2,
              absent_today: 0
            },
            insights: [
              '83% attendance rate today',
              '2 employees arrived late',
              'No absentees today'
            ]
          }
        },
        {
          id: 4,
          title: 'Quarterly Financial Report - Q3 2024',
          type: 'financial',
          period: 'quarterly',
          generated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          generated_by: 'Director',
          status: 'completed',
          file_path: '/reports/financial_q3_2024.pdf',
          summary: {
            total_records: 90,
            key_metrics: {
              total_revenue: 7500000,
              total_expenses: 4500000,
              net_profit: 3000000,
              profit_margin: 40
            },
            insights: [
              'Revenue increased by 22% compared to Q2',
              'Profit margin improved by 5%',
              'Operating expenses decreased by 8%'
            ]
          }
        }
      ];

      const mockMetrics: AnalyticsMetric[] = [
        {
          id: 'total_sales',
          title: 'Total Sales',
          value: 2500000,
          change: 15.2,
          changeType: 'increase',
          period: 'This Month',
          icon: AttachMoney,
          color: '#4caf50'
        },
        {
          id: 'total_orders',
          title: 'Total Orders',
          value: 150,
          change: 8.5,
          changeType: 'increase',
          period: 'This Month',
          icon: ShoppingCart,
          color: '#2196f3'
        },
        {
          id: 'active_employees',
          title: 'Active Employees',
          value: 12,
          change: 0,
          changeType: 'neutral',
          period: 'Currently',
          icon: Group,
          color: '#ff9800'
        },
        {
          id: 'inventory_value',
          title: 'Inventory Value',
          value: 1250000,
          change: -2.1,
          changeType: 'decrease',
          period: 'This Week',
          icon: Inventory,
          color: '#9c27b0'
        },
        {
          id: 'attendance_rate',
          title: 'Attendance Rate',
          value: 95.5,
          change: 3.2,
          changeType: 'increase',
          period: 'This Month',
          icon: AccessTime,
          color: '#f44336'
        },
        {
          id: 'online_cameras',
          title: 'Online Cameras',
          value: 8,
          change: 0,
          changeType: 'neutral',
          period: 'Currently',
          icon: Videocam,
          color: '#607d8b'
        }
      ];

      const mockChartData: ChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        datasets: [
          {
            label: 'Sales (₦)',
            data: [1800000, 2100000, 1950000, 2300000, 2200000, 2400000, 2250000, 2600000, 2350000, 2500000],
            borderColor: '#13bbc6',
            fill: false
          },
          {
            label: 'Orders',
            data: [120, 135, 125, 145, 140, 155, 150, 165, 145, 150],
            borderColor: '#FFD700',
            fill: false
          }
        ]
      };

      setReports(mockReports);
      setAnalyticsMetrics(mockMetrics);
      setChartData(mockChartData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, report?: ReportData) => {
    setDialogType(type);
    setSelectedReport(report || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedReport(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircleOutline />;
      case 'processing': return <Pending />;
      case 'failed': return <Cancel />;
      default: return <Report />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return <AttachMoney />;
      case 'inventory': return <Inventory />;
      case 'attendance': return <AccessTime />;
      case 'orders': return <ShoppingCart />;
      case 'employees': return <Group />;
      case 'surveillance': return <Videocam />;
      case 'financial': return <Assessment />;
      default: return <Report />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesPeriod = periodFilter === 'all' || report.period === periodFilter;
    return matchesSearch && matchesType && matchesPeriod;
  });

  const renderAnalyticsOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Analytics Dashboard
      </Typography>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {analyticsMetrics.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={metric.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: metric.color, mr: 2 }}>
                      <MetricIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                        {metric.value.toLocaleString()}
                        {metric.id === 'attendance_rate' && '%'}
                        {metric.id === 'total_sales' && '₦'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {metric.changeType === 'increase' && <TrendingUp sx={{ color: '#4caf50', mr: 1 }} />}
                    {metric.changeType === 'decrease' && <TrendingDown sx={{ color: '#f44336', mr: 1 }} />}
                    {metric.changeType === 'neutral' && <Remove sx={{ color: '#666', mr: 1 }} />}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: metric.changeType === 'increase' ? '#4caf50' : 
                              metric.changeType === 'decrease' ? '#f44336' : '#666'
                      }}
                    >
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {metric.period}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Sales & Orders Trend
              </Typography>
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                borderRadius: 2
              }}>
                <Typography variant="body1" color="text.secondary">
                  Chart visualization would be implemented here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Top Products
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#4caf50' }}>1</Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sachet Water" 
                    secondary="45% of total sales"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#2196f3' }}>2</Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sachet Water" 
                    secondary="30% of total sales"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#ff9800' }}>3</Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Water Bottles (500ml)" 
                    secondary="25% of total sales"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderReportsList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Reports & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-report')}
          sx={{ bgcolor: '#13bbc6' }}
        >
          Generate Report
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Reports"
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
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Report Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  label="Period"
                >
                  <MenuItem value="all">All Periods</MenuItem>
                  {reportPeriods.map((period) => (
                    <MenuItem key={period.value} value={period.value}>
                      {period.label}
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
                  setTypeFilter('all');
                  setPeriodFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Generated By</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Generated At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {report.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.summary.total_records} records
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTypeIcon(report.type)}
                        <Typography sx={{ ml: 1, textTransform: 'capitalize' }}>
                          {report.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {report.period}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.generated_by}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.status.charAt(0).toUpperCase() + report.status.slice(1)} 
                        color={getStatusColor(report.status) as any}
                        size="small"
                        icon={getStatusIcon(report.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(report.generated_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Report">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-report', report)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Report">
                        <IconButton size="small" onClick={() => handleOpenDialog('download-report', report)}>
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Report">
                        <IconButton size="small" onClick={() => handleOpenDialog('print-report', report)}>
                          <Print />
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
      case 'reports':
        return renderReportsList();
      case 'analytics':
        return renderAnalyticsOverview();
      default:
        return renderAnalyticsOverview();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new-report' && 'Generate New Report'}
          {dialogType === 'view-report' && 'Report Details'}
          {dialogType === 'download-report' && 'Download Report'}
          {dialogType === 'print-report' && 'Print Report'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'new-report' && 'Report generation functionality will be implemented here.'}
            {dialogType === 'view-report' && 'Report details view will be implemented here.'}
            {dialogType === 'download-report' && 'Report download functionality will be implemented here.'}
            {dialogType === 'print-report' && 'Report printing functionality will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new-report' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              Generate Report
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportingAnalytics;
