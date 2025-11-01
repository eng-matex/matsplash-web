import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { FilterList, Delete, Refresh } from '@mui/icons-material';
import axios from 'axios';

interface CustomerCall {
  id: number;
  dispatch_order_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  driver_id: number;
  driver_name: string;
  originator_driver_id: number;
  originator_driver_name: string;
  bags: number;
  processed: boolean;
  called_at: string;
  dispatch_order_number: string;
}

const DriverCustomerCallsView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState<CustomerCall[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    driver_id: '',
    originator_driver_id: '',
    phone: '',
    sort_by: 'date'
  });

  useEffect(() => {
    fetchData();
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('/api/employees', { headers });
      const driverRoles = ['Driver', 'Driver Assistant'];
      setDrivers((response.data.data || []).filter((emp: any) => driverRoles.includes(emp.role)));
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params: any = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.driver_id) params.driver_id = filters.driver_id;
      if (filters.originator_driver_id) params.originator_driver_id = filters.originator_driver_id;
      if (filters.phone) params.phone = filters.phone;
      if (filters.sort_by) params.sort_by = filters.sort_by;

      const response = await axios.get('/api/driver-dispatch/customer-calls/all', { 
        headers,
        params 
      });
      setCalls(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customer calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      driver_id: '',
      originator_driver_id: '',
      phone: '',
      sort_by: 'date'
    });
  };

  const handleDeleteCall = async (callId: number) => {
    if (!confirm('Are you sure you want to delete this customer call? This cannot be undone if it has been processed.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.delete(`/api/driver-dispatch/customer-calls/${callId}`, { headers });
      
      if (response.data.success) {
        alert('Customer call deleted successfully');
        fetchData();
      } else {
        alert(response.data.message || 'Error deleting call');
      }
    } catch (error: any) {
      console.error('Error deleting call:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error deleting customer call');
      }
    }
  };

  // Group calls by customer phone to show total bags per customer
  const getCustomerTotals = () => {
    const totals: { [key: string]: { name: string; phone: string; totalBags: number; totalAmount: number } } = {};
    calls.forEach(call => {
      if (!totals[call.customer_phone]) {
        totals[call.customer_phone] = {
          name: call.customer_name,
          phone: call.customer_phone,
          totalBags: 0,
          totalAmount: 0
        };
      }
      totals[call.customer_phone].totalBags += call.bags;
      totals[call.customer_phone].totalAmount += call.bags * 250;
    });
    return Object.values(totals).sort((a, b) => b.totalBags - a.totalBags);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Customer Calls (50+ Bags)
        </Typography>
        <Button startIcon={<Refresh />} onClick={fetchData} variant="outlined">
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Driver</InputLabel>
                <Select
                  value={filters.driver_id}
                  onChange={(e) => handleFilterChange('driver_id', e.target.value)}
                  label="Driver"
                >
                  <MenuItem value="">All Drivers</MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Originator</InputLabel>
                <Select
                  value={filters.originator_driver_id}
                  onChange={(e) => handleFilterChange('originator_driver_id', e.target.value)}
                  label="Originator"
                >
                  <MenuItem value="">All</MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <TextField
                fullWidth
                label="Phone"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                placeholder="Search..."
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <FormControl fullWidth>
                <InputLabel>Sort</InputLabel>
                <Select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  label="Sort"
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="highest_purchaser">Highest Purchaser</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<FilterList />}
              onClick={fetchData}
              sx={{ bgcolor: '#13bbc6' }}
            >
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Customer Summary */}
      {filters.sort_by === 'highest_purchaser' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Customer Summary (Total Purchases)</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Total Bags</TableCell>
                    <TableCell>Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getCustomerTotals().map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.totalBags}</TableCell>
                      <TableCell>₦{customer.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Calls Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Bags</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Originator</TableCell>
                  <TableCell>Dispatch Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      No customer calls found
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>{new Date(call.called_at).toLocaleString()}</TableCell>
                      <TableCell>{call.customer_name}</TableCell>
                      <TableCell>{call.customer_phone}</TableCell>
                      <TableCell>{call.customer_address || '-'}</TableCell>
                      <TableCell>{call.bags}</TableCell>
                      <TableCell>₦{(call.bags * 250).toLocaleString()}</TableCell>
                      <TableCell>{call.driver_name}</TableCell>
                      <TableCell>{call.originator_driver_name}</TableCell>
                      <TableCell>{call.dispatch_order_number}</TableCell>
                      <TableCell>
                        <Chip
                          label={call.processed ? 'Processed' : 'Pending'}
                          color={call.processed ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {!call.processed && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCall(call.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        )}
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

export default DriverCustomerCallsView;

