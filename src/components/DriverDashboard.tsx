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
                  My Dispatches
                </Typography>
                {activeDispatches.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order Number</TableCell>
                          <TableCell>Assistant</TableCell>
                          <TableCell>Bags</TableCell>
                          <TableCell>Total Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Settlement Status</TableCell>
                          <TableCell>Amount Settled</TableCell>
                          <TableCell>Balance Due</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeDispatches.map((dispatch) => (
                          <TableRow key={dispatch.id}>
                            <TableCell>{dispatch.order_number}</TableCell>
                            <TableCell>{dispatch.assistant_name || '-'}</TableCell>
                            <TableCell>{getBagsFromItems(dispatch.items)}</TableCell>
                            <TableCell>₦{(dispatch.expected_amount || dispatch.total_amount)?.toLocaleString() || 0}</TableCell>
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
                            <TableCell>
                              {dispatch.amount_collected ? (
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ₦{dispatch.amount_collected?.toLocaleString() || 0}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {dispatch.balance_due ? (
                                <Chip 
                                  label={`₦${dispatch.balance_due?.toLocaleString() || 0}`} 
                                  color={dispatch.balance_due === 0 ? 'success' : 'error'}
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
                  <Typography color="text.secondary">No dispatches found</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderActiveDispatches = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Active Dispatches
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dispatch ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell>{dispatch.dispatch_number}</TableCell>
                    <TableCell>{dispatch.customer_name}</TableCell>
                    <TableCell>
                      <Tooltip title={dispatch.customer_address}>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dispatch.customer_address}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{dispatch.customer_phone}</TableCell>
                    <TableCell>₦{dispatch.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={dispatch.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(dispatch.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(dispatch.assigned_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-dispatch', dispatch)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton size="small" onClick={() => handleOpenDialog('update-status', dispatch)}>
                          <Edit />
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

  const renderDispatchLog = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Dispatch Log
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Dispatches" />
            <Tab label="Delivered" />
            <Tab label="Failed" />
            <Tab label="Commission Summary" />
          </Tabs>

          {selectedTab < 3 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dispatch ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned</TableCell>
                    <TableCell>Delivered</TableCell>
                    <TableCell>Commission</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dispatchLogs
                    .filter(dispatch => {
                      if (selectedTab === 0) return true;
                      if (selectedTab === 1) return dispatch.status === 'delivered';
                      if (selectedTab === 2) return dispatch.status === 'failed';
                      return true;
                    })
                    .map((dispatch) => (
                      <TableRow key={dispatch.id}>
                        <TableCell>{dispatch.dispatch_number}</TableCell>
                        <TableCell>{dispatch.customer_name}</TableCell>
                        <TableCell>
                          <Tooltip title={dispatch.customer_address}>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {dispatch.customer_address}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>₦{dispatch.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={dispatch.status} 
                            color={getStatusColor(dispatch.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(dispatch.assigned_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {dispatch.delivered_at ? new Date(dispatch.delivered_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>₦{dispatch.commission?.toLocaleString() || '0'}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleOpenDialog('view-dispatch', dispatch)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {selectedTab === 3 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Today's Commission
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                        ₦{dispatchLogs
                          .filter(d => d.status === 'delivered' && new Date(d.delivered_at).toDateString() === new Date().toDateString())
                          .reduce((sum, d) => sum + (d.commission || 0), 0)
                          .toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        This Month's Commission
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                        ₦{dispatchLogs
                          .filter(d => d.status === 'delivered' && 
                            new Date(d.delivered_at).getMonth() === new Date().getMonth() &&
                            new Date(d.delivered_at).getFullYear() === new Date().getFullYear())
                          .reduce((sum, d) => sum + (d.commission || 0), 0)
                          .toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const renderSalesAccounting = () => {
    const filteredCommissions = filterStatus === 'all' 
      ? salesLogs 
      : salesLogs.filter((log: any) => log.status === filterStatus);
    
    const pendingCommissions = salesLogs.filter((log: any) => log.status === 'pending');
    const approvedCommissions = salesLogs.filter((log: any) => log.status === 'approved');
    
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Sales & Commission History
        </Typography>

        <Grid container spacing={3}>
          {/* Total Commission Earned */}
          <Grid item xs={12} sm={6} md={4}>
            <Card className="dashboard-card" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setFilterStatus('approved')}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600 }}>
                  Approved
                </Typography>
                <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                  ₦{(commissionData.totalCommission || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {approvedCommissions.length} commissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Commission */}
          <Grid item xs={12} sm={6} md={4}>
            <Card className="dashboard-card" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setFilterStatus('pending')}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#ff9800', fontWeight: 600 }}>
                  Pending
                </Typography>
                <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                  ₦{(commissionData.pendingCommission || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Awaiting approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Bags Sold */}
          <Grid item xs={12} sm={6} md={4}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#13bbc6', fontWeight: 600 }}>
                  Total Bags Sold
                </Typography>
                <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                  {salesLogs.reduce((sum, log: any) => sum + (log.bags_sold || 0), 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across all orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card className="dashboard-card" sx={{ mt: 3, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>Filter:</Typography>
              <Chip 
                label="All" 
                onClick={() => setFilterStatus('all')} 
                color={filterStatus === 'all' ? 'primary' : 'default'}
                clickable
              />
              <Chip 
                label="Pending" 
                onClick={() => setFilterStatus('pending')} 
                color={filterStatus === 'pending' ? 'warning' : 'default'}
                clickable
              />
              <Chip 
                label="Approved" 
                onClick={() => setFilterStatus('approved')} 
                color={filterStatus === 'approved' ? 'success' : 'default'}
                clickable
              />
              <Chip 
                label="Rejected" 
                onClick={() => setFilterStatus('rejected')} 
                color={filterStatus === 'rejected' ? 'error' : 'default'}
                clickable
              />
            </Box>
          </CardContent>
        </Card>

        {/* Commission History Table */}
        <Card className="dashboard-card">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
              Commission Records ({filteredCommissions.length})
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Settlement handled by Receptionist. Manager reviews and approves commissions for payment.
            </Alert>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Order Number</strong></TableCell>
                    <TableCell><strong>Bags Sold</strong></TableCell>
                    <TableCell><strong>Bags Returned</strong></TableCell>
                    <TableCell><strong>Commission Amount</strong></TableCell>
                    <TableCell><strong>Delivery Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No commission records found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommissions.map((log: any) => (
                      <TableRow key={log.id} hover>
                        <TableCell><strong>{log.order_number}</strong></TableCell>
                        <TableCell>{log.bags_sold || 0}</TableCell>
                        <TableCell>{log.bags_returned || 0}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: log.status === 'approved' ? '#4caf50' : 'inherit' }}>
                            ₦{(log.commission_amount || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(log.delivery_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.status?.toUpperCase() || 'PENDING'} 
                            color={log.status === 'approved' ? 'success' : 
                                   log.status === 'rejected' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
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
      case 'my-attendance':
        return <AttendanceManagement selectedSection={selectedSection} userRole="driver" />;
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
          {dialogType === 'view-dispatch' && 'Dispatch Details'}
          {dialogType === 'update-status' && 'Update Dispatch Status'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'view-dispatch' && selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>Dispatch Information</Typography>
              <Typography><strong>Dispatch ID:</strong> {selectedItem.dispatch_number}</Typography>
              <Typography><strong>Customer:</strong> {selectedItem.customer_name}</Typography>
              <Typography><strong>Phone:</strong> {selectedItem.customer_phone}</Typography>
              <Typography><strong>Address:</strong> {selectedItem.customer_address}</Typography>
              <Typography><strong>Amount:</strong> ₦{selectedItem.total_amount?.toLocaleString()}</Typography>
              <Typography><strong>Status:</strong> {selectedItem.status}</Typography>
              {selectedItem.delivery_instructions && (
                <Typography><strong>Instructions:</strong> {selectedItem.delivery_instructions}</Typography>
              )}
              
              <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Items</Typography>
              <List>
                {selectedItem.items?.map((item: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.quantity} ${item.unit}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {dialogType === 'update-status' && (
            <Box>
              <Typography variant="h6" gutterBottom>Update Dispatch Status</Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="status"
                  name="status"
                  defaultValue="in_transit"
                >
                  <FormControlLabel value="in_transit" control={<Radio />} label="In Transit" />
                  <FormControlLabel value="delivered" control={<Radio />} label="Delivered" />
                  <FormControlLabel value="failed" control={<Radio />} label="Failed Delivery" />
                </RadioGroup>
              </FormControl>
              
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                sx={{ mt: 2 }}
                placeholder="Add any notes about the delivery..."
              />
            </Box>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'update-status' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              Update Status
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDashboard;
