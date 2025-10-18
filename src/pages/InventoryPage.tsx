import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Inventory,
  Warning,
  TrendingUp,
  TrendingDown,
  History,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { InventoryLog } from '../types';
import axios from 'axios';

interface InventoryStats {
  currentStock: number;
  lowStockThreshold: number;
  totalMovements: number;
  recentMovements: InventoryLog[];
}

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<InventoryLog | null>(null);
  const [adjustment, setAdjustment] = useState({
    operation_type: 'manual_adjustment',
    bags_added: 0,
    bags_removed: 0,
    notes: ''
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const [statsResponse, logsResponse] = await Promise.all([
        axios.get('/inventory/stats'),
        axios.get('/inventory/logs')
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (logsResponse.data.success) {
        setLogs(logsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryAdjustment = async () => {
    try {
      const adjustmentData = {
        ...adjustment,
        performed_by: user?.id,
        current_stock: (stats?.currentStock || 0) + adjustment.bags_added - adjustment.bags_removed
      };

      const response = await axios.post('/inventory/adjust', adjustmentData);
      if (response.data.success) {
        setAdjustDialogOpen(false);
        setAdjustment({
          operation_type: 'manual_adjustment',
          bags_added: 0,
          bags_removed: 0,
          notes: ''
        });
        fetchInventoryData();
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error);
    }
  };

  const getOperationTypeColor = (type: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'order_pickup': 'warning',
      'return_processing': 'info',
      'manual_adjustment': 'primary',
      'initial_stock': 'success'
    };
    return colors[type] || 'default';
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'order_pickup':
        return <TrendingDown color="warning" />;
      case 'return_processing':
        return <TrendingUp color="info" />;
      case 'manual_adjustment':
        return <Edit color="primary" />;
      case 'initial_stock':
        return <Inventory color="success" />;
      default:
        return <Inventory />;
    }
  };

  const isLowStock = stats && stats.currentStock <= stats.lowStockThreshold;
  const canManageInventory = ['Admin', 'Manager', 'StoreKeeper'].includes(user?.role || '');

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchInventoryData}
          >
            Refresh
          </Button>
          {canManageInventory && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAdjustDialogOpen(true)}
            >
              Adjust Stock
            </Button>
          )}
        </Box>
      </Box>

      {/* Low Stock Alert */}
      {isLowStock && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning />
            <Typography>
              Low Stock Alert: Current stock ({stats?.currentStock}) is below threshold ({stats?.lowStockThreshold})
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Inventory Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Current Stock</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {stats?.currentStock || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Water sachet bags
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Low Stock Threshold</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {stats?.lowStockThreshold || 100}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Minimum stock level
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <History color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Movements</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {stats?.totalMovements || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Stock Status</Typography>
              </Box>
              <Chip
                label={isLowStock ? 'Low Stock' : 'Adequate'}
                color={isLowStock ? 'warning' : 'success'}
                size="large"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inventory Logs */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Inventory Movements
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Order #</TableCell>
                  <TableCell>Bags Added</TableCell>
                  <TableCell>Bags Removed</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Performed By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getOperationIcon(log.operation_type)}
                        <Chip
                          label={log.operation_type.replace('_', ' ').toUpperCase()}
                          color={getOperationTypeColor(log.operation_type)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {log.order_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {log.bags_added > 0 ? (
                        <Typography color="success.main">
                          +{log.bags_added}
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">0</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.bags_removed > 0 ? (
                        <Typography color="error.main">
                          -{log.bags_removed}
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">0</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {log.current_stock}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      Employee #{log.performed_by}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Visibility />
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

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Inventory Stock</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Operation Type</InputLabel>
                <Select
                  value={adjustment.operation_type}
                  onChange={(e) => setAdjustment({ ...adjustment, operation_type: e.target.value })}
                >
                  <MenuItem value="manual_adjustment">Manual Adjustment</MenuItem>
                  <MenuItem value="initial_stock">Initial Stock</MenuItem>
                  <MenuItem value="return_processing">Return Processing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bags Added"
                type="number"
                value={adjustment.bags_added}
                onChange={(e) => setAdjustment({ ...adjustment, bags_added: parseInt(e.target.value) || 0 })}
                helperText="Enter 0 if no bags were added"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bags Removed"
                type="number"
                value={adjustment.bags_removed}
                onChange={(e) => setAdjustment({ ...adjustment, bags_removed: parseInt(e.target.value) || 0 })}
                helperText="Enter 0 if no bags were removed"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={adjustment.notes}
                onChange={(e) => setAdjustment({ ...adjustment, notes: e.target.value })}
                placeholder="Optional notes about this adjustment..."
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Current Stock: {stats?.currentStock || 0} bags
                <br />
                After Adjustment: {(stats?.currentStock || 0) + adjustment.bags_added - adjustment.bags_removed} bags
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInventoryAdjustment} variant="contained">
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Log Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Inventory Movement Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Date & Time</Typography>
                <Typography variant="body1">
                  {new Date(selectedLog.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Operation Type</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getOperationIcon(selectedLog.operation_type)}
                  <Chip
                    label={selectedLog.operation_type.replace('_', ' ').toUpperCase()}
                    color={getOperationTypeColor(selectedLog.operation_type)}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Order Number</Typography>
                <Typography variant="body1">
                  {selectedLog.order_number || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Performed By</Typography>
                <Typography variant="body1">
                  Employee #{selectedLog.performed_by}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Bags Added</Typography>
                <Typography variant="h6" color="success.main">
                  +{selectedLog.bags_added}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Bags Removed</Typography>
                <Typography variant="h6" color="error.main">
                  -{selectedLog.bags_removed}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Current Stock</Typography>
                <Typography variant="h6" color="primary">
                  {selectedLog.current_stock}
                </Typography>
              </Grid>
              {selectedLog.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography variant="body1">
                    {selectedLog.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InventoryPage;
