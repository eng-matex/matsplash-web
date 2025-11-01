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
  Radio
} from '@mui/material';
import {
  LocalShipping,
  Assessment,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Add,
  Edit,
  Delete,
  Visibility,
  LocationOn,
  Phone,
  Payment,
  Warning,
  Done,
  Schedule,
  DirectionsCar
} from '@mui/icons-material';
import axios from 'axios';
import AttendanceManagement from './AttendanceManagement';
import { useAuth } from '../context/AuthContext';

interface DriverDashboardProps {
  selectedSection: string;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ selectedSection }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeDispatches, setActiveDispatches] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [salesLogs, setSalesLogs] = useState<any[]>([]);
  const [commissionData, setCommissionData] = useState<any>({});
  const [myCommissions, setMyCommissions] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dispatchFilter, setDispatchFilter] = useState({
    status: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: ''
  });
  const [settlementData, setSettlementData] = useState({
    bags_sold: 0,
    bags_returned: 0,
    total_sales: 0,
    commission_earned: 0,
    money_submitted: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  // Helper functions for pay period calculations
  const getCurrentPayPeriod = () => {
    const today = new Date();
    const day = today.getDate();
    
    if (day >= 1 && day <= 15) {
      return {
        label: '1st - 15th',
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth(), 15),
        payDate: new Date(today.getFullYear(), today.getMonth(), 18)
      };
    } else {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        label: '16th - End',
        start: new Date(today.getFullYear(), today.getMonth(), 16),
        end: endOfMonth,
        payDate: new Date(today.getFullYear(), today.getMonth() + 1, 5)
      };
    }
  };

  const getCurrentPeriodBags = () => {
    const period = getCurrentPayPeriod();
    return myCommissions.filter(comm => {
      const commDate = new Date(comm.delivery_date);
      const commDateOnly = new Date(commDate.getFullYear(), commDate.getMonth(), commDate.getDate());
      const periodStartOnly = new Date(period.start.getFullYear(), period.start.getMonth(), period.start.getDate());
      const periodEndOnly = new Date(period.end.getFullYear(), period.end.getMonth(), period.end.getDate());
      return comm.status === 'approved' && 
             commDateOnly >= periodStartOnly && 
             commDateOnly <= periodEndOnly;
    }).reduce((sum, comm) => sum + (comm.bags_sold || 0), 0);
  };

  const getNextPeriodBags = () => {
    const today = new Date();
    const day = today.getDate();
    
    if (day >= 1 && day <= 15) {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const period = {
        start: new Date(today.getFullYear(), today.getMonth(), 16),
        end: endOfMonth,
        payDate: new Date(today.getFullYear(), today.getMonth() + 1, 5)
      };
      const bags = myCommissions.filter(comm => {
        const commDate = new Date(comm.delivery_date);
        const commDateOnly = new Date(commDate.getFullYear(), commDate.getMonth(), commDate.getDate());
        const periodStartOnly = new Date(period.start.getFullYear(), period.start.getMonth(), period.start.getDate());
        const periodEndOnly = new Date(period.end.getFullYear(), period.end.getMonth(), period.end.getDate());
        return comm.status === 'approved' && 
               commDateOnly >= periodStartOnly && 
               commDateOnly <= periodEndOnly;
      }).reduce((sum, comm) => sum + (comm.bags_sold || 0), 0);
      return bags;
    } else {
      const period = {
        start: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 15),
        payDate: new Date(today.getFullYear(), today.getMonth() + 2, 18)
      };
      const bags = myCommissions.filter(comm => {
        const commDate = new Date(comm.delivery_date);
        const commDateOnly = new Date(commDate.getFullYear(), commDate.getMonth(), commDate.getDate());
        const periodStartOnly = new Date(period.start.getFullYear(), period.start.getMonth(), period.start.getDate());
        const periodEndOnly = new Date(period.end.getFullYear(), period.end.getMonth(), period.end.getDate());
        return comm.status === 'approved' && 
               commDateOnly >= periodStartOnly && 
               commDateOnly <= periodEndOnly;
      }).reduce((sum, comm) => sum + (comm.bags_sold || 0), 0);
      return bags;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      switch (selectedSection) {
        case 'overview':
        case 'active-dispatches':
          // Fetch all driver dispatches (not just out_for_delivery) to show all statuses
          try {
            const [dispatchesRes, commissionsRes] = await Promise.all([
              axios.get(`http://localhost:3002/api/driver-dispatch?driver_id=${user?.id}`, { headers }),
              axios.get(`http://localhost:3002/api/driver-dispatch/commissions?driver_id=${user?.id}`, { headers })
            ]);
            if (dispatchesRes.data.success) {
              setActiveDispatches(dispatchesRes.data.data || []);
            } else {
              setActiveDispatches([]);
            }
            if (commissionsRes.data.success) {
              // Commissions already filtered by driver_id in API
              setMyCommissions(commissionsRes.data.data || []);
            }
          } catch (error) {
            console.error('Error fetching dispatches:', error);
            setActiveDispatches([]);
          }
          break;
        case 'dispatch-log':
          // Fetch completed dispatches
          try {
            const response = await axios.get('http://localhost:3002/api/driver-dispatch?status=settled', { headers });
            if (response.data.success) {
              setDispatchLogs(response.data.data || []);
            } else {
              setDispatchLogs([]);
            }
          } catch (error) {
            console.error('Error fetching dispatch logs:', error);
            setDispatchLogs([]);
          }
          break;
        case 'sales-accounting':
          // Fetch commission data for this driver
          try {
            const response = await axios.get(`http://localhost:3002/api/driver-dispatch/commissions?driver_id=${user?.id}`, { headers });
            if (response.data.success) {
              // Commissions already filtered by driver_id in API
              const myCommissions = response.data.data || [];
              setSalesLogs(myCommissions);
              // Calculate totals
              setCommissionData({
                totalSales: myCommissions.reduce((sum: number, c: any) => sum + (c.total_revenue || 0), 0),
                totalCommission: myCommissions.reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0),
                pendingCommission: myCommissions.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0)
              });
            } else {
              setSalesLogs([]);
              setCommissionData({ totalSales: 0, totalCommission: 0, pendingCommission: 0 });
            }
          } catch (error) {
            console.error('Error fetching sales data:', error);
            setSalesLogs([]);
            setCommissionData({ totalSales: 0, totalCommission: 0, pendingCommission: 0 });
          }
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
    setActiveStep(0);
    setSettlementData({
      bags_sold: 0,
      bags_returned: 0,
      total_sales: 0,
      commission_earned: 0,
      money_submitted: 0,
      notes: ''
    });
  };

  const handleUpdateDispatchStatus = async (dispatchId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.put(`http://localhost:3002/api/orders/${dispatchId}/status`, {
        status: newStatus,
        userId: 1, // This should come from auth context
        notes: `Status updated to ${newStatus} by driver`
      }, { headers });

      if (response.data.success) {
        fetchData(); // Refresh data
        alert(`Dispatch status updated to ${newStatus}`);
      } else {
        alert('Error updating dispatch status: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      alert('Error updating dispatch status. Please try again.');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned': return 'info';
      case 'in_transit': return 'warning';
      case 'delivered': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned': return <Schedule />;
      case 'in_transit': return <LocalShipping />;
      case 'delivered': return <CheckCircle />;
      case 'failed': return <Cancel />;
      default: return <Pending />;
    }
  };

  // Helper to get bags from items JSON
  const getBagsFromItems = (items: any): number => {
    try {
      const itemList = typeof items === 'string' ? JSON.parse(items) : items;
      return itemList[0]?.quantity || 0;
    } catch {
      return 0;
    }
  };

  const renderOverview = () => {
    // Filter dispatches based on selected filters
    const filteredDispatches = activeDispatches.filter(d => {
      // Status filter
      if (dispatchFilter.status !== 'all' && d.status !== dispatchFilter.status) {
        return false;
      }

      // Date range filter
      if (dispatchFilter.dateRange === 'custom') {
        const dispatchDate = new Date(d.created_at);
        const start = new Date(dispatchFilter.startDate);
        const end = new Date(dispatchFilter.endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        if (dispatchDate < start || dispatchDate > end) {
          return false;
        }
      } else if (dispatchFilter.dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dispatchDate = new Date(d.created_at);
        dispatchDate.setHours(0, 0, 0, 0);
        if (dispatchDate.getTime() !== today.getTime()) {
          return false;
        }
      } else if (dispatchFilter.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (new Date(d.created_at) < weekAgo) {
          return false;
        }
      } else if (dispatchFilter.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (new Date(d.created_at) < monthAgo) {
          return false;
        }
      }

      return true;
    });

    const outForDelivery = activeDispatches.filter(d => d.status === 'out_for_delivery');
    const settlementPending = activeDispatches.filter(d => d.status === 'settlement_pending');
    const settled = activeDispatches.filter(d => d.status === 'settled');
    
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Driver Dashboard
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalShipping sx={{ mr: 1, color: '#13bbc6' }} />
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>Out for Delivery</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                  {outForDelivery.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently on delivery
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Payment sx={{ mr: 1, color: '#ff9800' }} />
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>Pending Settlement</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                  {settlementPending.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Awaiting settlement
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>Settled</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                  {settled.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fully settled
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Payment sx={{ mr: 1, color: '#FFD700' }} />
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>Approved Commissions</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
                  ₦{myCommissions
                    .filter(c => c.status === 'approved')
                    .reduce((sum, c) => sum + (c.commission_amount || 0), 0)
                    .toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total earned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  My Dispatches ({filteredDispatches.length})
                </Typography>
                
                {/* Filter Controls */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={dispatchFilter.status}
                      label="Status"
                      onChange={(e) => setDispatchFilter({ ...dispatchFilter, status: e.target.value })}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="pending_pickup">Pending Pickup</MenuItem>
                      <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
                      <MenuItem value="settlement_pending">Settlement Pending</MenuItem>
                      <MenuItem value="settled">Settled</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={dispatchFilter.dateRange}
                      label="Date Range"
                      onChange={(e) => setDispatchFilter({ ...dispatchFilter, dateRange: e.target.value })}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">Last 7 Days</MenuItem>
                      <MenuItem value="month">Last 30 Days</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>

                  {dispatchFilter.dateRange === 'custom' && (
                    <>
                      <TextField
                        size="small"
                        type="date"
                        label="Start Date"
                        InputLabelProps={{ shrink: true }}
                        value={dispatchFilter.startDate}
                        onChange={(e) => setDispatchFilter({ ...dispatchFilter, startDate: e.target.value })}
                      />
                      <TextField
                        size="small"
                        type="date"
                        label="End Date"
                        InputLabelProps={{ shrink: true }}
                        value={dispatchFilter.endDate}
                        onChange={(e) => setDispatchFilter({ ...dispatchFilter, endDate: e.target.value })}
                      />
                    </>
                  )}

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setDispatchFilter({ status: 'all', dateRange: 'all', startDate: '', endDate: '' })}
                  >
                    Reset
                  </Button>
                </Box>

                {filteredDispatches.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order Number</TableCell>
                          <TableCell>Assistant</TableCell>
                          <TableCell>Bags</TableCell>
                          <TableCell>Date Assigned</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Settlement Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredDispatches.map((dispatch) => (
                          <TableRow key={dispatch.id} hover>
                            <TableCell><strong>{dispatch.order_number}</strong></TableCell>
                            <TableCell>{dispatch.assistant_name || '-'}</TableCell>
                            <TableCell>{getBagsFromItems(dispatch.items)}</TableCell>
                            <TableCell>
                              {new Date(dispatch.created_at).toLocaleDateString()}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(dispatch.created_at).toLocaleTimeString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={dispatch.status.replace('_', ' ').toUpperCase()} 
                                color={getStatusColor(dispatch.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {dispatch.settlement_status ? (
                                <Chip 
                                  label={dispatch.settlement_status.replace('_', ' ').toUpperCase()} 
                                  color={dispatch.balance_due === 0 ? 'success' : 'warning'}
                                  size="small"
                                />
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                    No dispatches found
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderDispatchLog = () => {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Dispatch History
        </Typography>
        {dispatchLogs.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Assistant</TableCell>
                  <TableCell>Bags</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Settlement Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dispatchLogs.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell>{dispatch.order_number}</TableCell>
                    <TableCell>{dispatch.assistant_name || '-'}</TableCell>
                    <TableCell>{getBagsFromItems(dispatch.items)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={dispatch.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(dispatch.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {dispatch.settlement_status ? (
                        <Chip 
                          label={dispatch.settlement_status.replace('_', ' ').toUpperCase()} 
                          color={dispatch.balance_due === 0 ? 'success' : 'warning'}
                          size="small"
                        />
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            No dispatch history found
          </Typography>
        )}
      </Box>
    );
  };

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
      case 'active-dispatches':
        return renderOverview();
      case 'dispatch-log':
        return renderDispatchLog();
      case 'sales-accounting':
        return renderSalesAccounting();
      default:
        return renderOverview();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>View Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              {/* Dialog content will be added here */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDashboard;
