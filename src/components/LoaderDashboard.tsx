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
  Inventory,
  Assessment,
  AccessTime,
  CheckCircle,
  Warning,
  Add,
  Edit,
  Delete,
  Visibility,
  LocalShipping,
  Schedule,
  TrendingUp,
  Person,
  Timer,
  PlayArrow,
  Pause,
  Stop,
  DirectionsCar,
  Warehouse,
  ShoppingCart,
  Speed
} from '@mui/icons-material';
import axios from 'axios';
import AttendanceManagement from './AttendanceManagement';

interface LoaderDashboardProps {
  selectedSection: string;
}

const LoaderDashboard: React.FC<LoaderDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [loadingNotes, setLoadingNotes] = useState('');
  const [moveItem, setMoveItem] = useState({
    item_id: '',
    from_location: '',
    to_location: '',
    quantity: '',
    reason: ''
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
        case 'loading-tasks':
          // TODO: Fetch loading tasks from API
          setLoadingTasks([]);
          break;
        case 'inventory-management':
          // TODO: Fetch inventory items from API
          setInventoryItems([]);
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
    setLoadingProgress('');
    setLoadingNotes('');
    setMoveItem({
      item_id: '',
      from_location: '',
      to_location: '',
      quantity: '',
      reason: ''
    });
  };

  const handleStartTask = (task: any) => {
    setCurrentTask(task);
    setIsWorking(true);
  };

  const handleUpdateLoadingProgress = async () => {
    if (!selectedItem || !loadingProgress) {
      alert('Please enter progress information');
      return;
    }

    try {
      const updatedTasks = loadingTasks.map(task =>
        task.id === selectedItem.id
          ? { 
              ...task, 
              progress: Math.min(100, (task.progress || 0) + parseInt(loadingProgress)),
              status: Math.min(100, (task.progress || 0) + parseInt(loadingProgress)) >= 100 ? 'completed' : 'in_progress',
              notes: loadingNotes
            }
          : task
      );
      setLoadingTasks(updatedTasks);
      alert('Loading progress updated successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating loading progress:', error);
      alert('Error updating loading progress. Please try again.');
    }
  };

  const handleMoveItem = async () => {
    if (!moveItem.item_id || !moveItem.to_location || !moveItem.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const updatedItems = inventoryItems.map(item =>
        item.id === moveItem.item_id
          ? { 
              ...item, 
              location: moveItem.to_location,
              last_moved: new Date().toISOString()
            }
          : item
      );
      setInventoryItems(updatedItems);
      alert('Item moved successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error moving item:', error);
      alert('Error moving item. Please try again.');
    }
  };

  const handleStopTask = () => {
    setIsWorking(false);
    setCurrentTask(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'available': return 'success';
      case 'low_stock': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const calculateProgress = (loaded: number, total: number) => {
    return Math.round((loaded / total) * 100);
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Loader Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Active Tasks</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {loadingTasks.filter(t => t.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently loading
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: '#FFD700' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Pending Tasks</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
                {loadingTasks.filter(t => t.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting start
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Completed Today</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {loadingTasks.filter(t => t.status === 'completed' && new Date(t.assigned_at).toDateString() === new Date().toDateString()).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasks finished
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Items Loaded</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                {loadingTasks.filter(t => t.status === 'completed' && new Date(t.assigned_at).toDateString() === new Date().toDateString()).reduce((sum, t) => sum + (t.loaded_items || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today's total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isWorking && currentTask && (
        <Card className="dashboard-card" sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1976d2' }}>
                  Currently Loading: {currentTask.task_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTask.customer_name} - {currentTask.vehicle_assigned}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress: {calculateProgress(currentTask.loaded_items || 0, currentTask.total_items)}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Pause />}
                  sx={{ bgcolor: '#ff9800' }}
                >
                  Pause
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Stop />}
                  onClick={handleStopTask}
                  sx={{ bgcolor: '#f44336' }}
                >
                  Stop
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Active Loading Tasks
              </Typography>
              {loadingTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length > 0 ? (
                <List>
                  {loadingTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').map((task) => (
                    <ListItem key={task.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <ListItemIcon>
                          <LocalShipping />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.task_number}
                          secondary={`${task.customer_name} - ${task.vehicle_assigned}`}
                        />
                        <Chip 
                          label={task.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(task.status) as any}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ ml: 4, width: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Order: {task.order_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Items: {task.loaded_items || 0}/{task.total_items}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Priority: <Chip label={task.priority.toUpperCase()} color={getPriorityColor(task.priority) as any} size="small" />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bay: {task.loading_bay}
                        </Typography>
                        {task.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartTask(task)}
                            sx={{ mt: 1, bgcolor: '#4caf50' }}
                          >
                            Start Loading
                          </Button>
                        )}
                      </Box>
                      <Divider sx={{ width: '100%', mt: 1 }} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No active loading tasks</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Inventory Status
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryItems.slice(0, 5).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.current_stock}</TableCell>
                        <TableCell>
                          <Tooltip title={item.location}>
                            <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.location}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.status.replace('_', ' ').toUpperCase()} 
                            color={getStatusColor(item.status) as any}
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
      </Grid>
    </Box>
  );

  const renderLoadingTasks = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Loading Tasks
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Tasks" />
            <Tab label="Pending" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task ID</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Bay</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingTasks
                  .filter(task => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return task.status === 'pending';
                    if (selectedTab === 2) return task.status === 'in_progress';
                    if (selectedTab === 3) return task.status === 'completed';
                    return true;
                  })
                  .map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.task_number}</TableCell>
                      <TableCell>{task.order_number}</TableCell>
                      <TableCell>{task.customer_name}</TableCell>
                      <TableCell>
                        <Tooltip title={task.items.map((item: any) => `${item.name}: ${item.quantity} ${item.unit}`).join(', ')}>
                          <Typography variant="body2">
                            {task.total_items} items
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{task.vehicle_assigned}</TableCell>
                      <TableCell>{task.loading_bay}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 100, bgcolor: '#e0e0e0', borderRadius: 1, height: 8 }}>
                            <Box 
                              sx={{ 
                                width: `${calculateProgress(task.loaded_items || 0, task.total_items)}%`, 
                                bgcolor: '#4caf50', 
                                height: '100%', 
                                borderRadius: 1 
                              }} 
                            />
                          </Box>
                          <Typography variant="body2">
                            {calculateProgress(task.loaded_items || 0, task.total_items)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={task.priority.toUpperCase()} 
                          color={getPriorityColor(task.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={task.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(task.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view-task', task)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {task.status === 'pending' && (
                          <Tooltip title="Start Loading">
                            <IconButton size="small" onClick={() => handleStartTask(task)}>
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        {task.status === 'in_progress' && (
                          <Tooltip title="Update Progress">
                            <IconButton size="small" onClick={() => handleOpenDialog('update-task', task)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
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

  const renderInventoryManagement = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Inventory Management
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Items" />
            <Tab label="Available" />
            <Tab label="Low Stock" />
            <Tab label="Critical" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Last Moved</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryItems
                  .filter(item => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return item.status === 'available';
                    if (selectedTab === 2) return item.status === 'low_stock';
                    if (selectedTab === 3) return item.status === 'critical';
                    return true;
                  })
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>
                        <Tooltip title={item.location}>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.location}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{new Date(item.last_moved).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view-item', item)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Move Item">
                          <IconButton size="small" onClick={() => handleOpenDialog('move-item', item)}>
                            <DirectionsCar />
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

  const renderTaskDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Loading Task Details
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Task ID</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.task_id || selectedItem.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={selectedItem.status?.toUpperCase() || 'UNKNOWN'}
              color={
                selectedItem.status === 'completed' ? 'success' :
                selectedItem.status === 'in_progress' ? 'warning' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.customer || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.vehicle || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Bay</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.bay || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <Chip
              label={selectedItem.priority?.toUpperCase() || 'NORMAL'}
              color={
                selectedItem.priority === 'high' ? 'error' :
                selectedItem.priority === 'medium' ? 'warning' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Progress</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.progress || 0}%</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Items</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.items || 'N/A'}</Typography>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderUpdateLoadingForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Update Loading Progress
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Task: {selectedItem.task_id} - {selectedItem.customer}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current Progress: {selectedItem.progress || 0}%
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Additional Progress (%)"
              type="number"
              value={loadingProgress}
              onChange={(e) => setLoadingProgress(e.target.value)}
              placeholder="Enter percentage to add"
              helperText="Enter the percentage of loading progress to add"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Loading Notes"
              value={loadingNotes}
              onChange={(e) => setLoadingNotes(e.target.value)}
              placeholder="Add any notes about the loading process..."
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderItemDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Inventory Item Details
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Item Name</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Current Stock</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.stock || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Location</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.location || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={selectedItem.status?.toUpperCase() || 'UNKNOWN'}
              color={
                selectedItem.status === 'available' ? 'success' :
                selectedItem.status === 'low_stock' ? 'warning' :
                selectedItem.status === 'critical' ? 'error' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Last Moved</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.last_moved || 'N/A'}</Typography>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderMoveItemForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Move Inventory Item
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Item: {selectedItem.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current Location: {selectedItem.location}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current Stock: {selectedItem.stock}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity to Move"
              type="number"
              value={moveItem.quantity}
              onChange={(e) => setMoveItem({ ...moveItem, quantity: e.target.value })}
              placeholder="Enter quantity"
              helperText="Enter the quantity to move"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="To Location"
              value={moveItem.to_location}
              onChange={(e) => setMoveItem({ ...moveItem, to_location: e.target.value })}
              placeholder="e.g., Bay A, Warehouse B"
              helperText="Enter the destination location"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Reason for Move"
              value={moveItem.reason}
              onChange={(e) => setMoveItem({ ...moveItem, reason: e.target.value })}
              placeholder="Enter reason for moving this item..."
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
      )}
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
      case 'loading-tasks':
        return renderLoadingTasks();
      case 'inventory-management':
        return renderInventoryManagement();
      case 'my-attendance':
        return <AttendanceManagement selectedSection={selectedSection} userRole="loader" />;
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
          {dialogType === 'view-task' && 'Loading Task Details'}
          {dialogType === 'update-task' && 'Update Loading Progress'}
          {dialogType === 'view-item' && 'Inventory Item Details'}
          {dialogType === 'move-item' && 'Move Inventory Item'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'view-task' && renderTaskDetails()}
          {dialogType === 'update-task' && renderUpdateLoadingForm()}
          {dialogType === 'view-item' && renderItemDetails()}
          {dialogType === 'move-item' && renderMoveItemForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'update-task' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleUpdateLoadingProgress}>
              Update Progress
            </Button>
          )}
          {dialogType === 'move-item' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleMoveItem}>
              Move Item
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoaderDashboard;
