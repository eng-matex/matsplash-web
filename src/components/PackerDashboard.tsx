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
  StepContent
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
  Factory,
  Schedule,
  TrendingUp,
  Person,
  Timer,
  PlayArrow,
  Pause,
  Stop
} from '@mui/icons-material';
import axios from 'axios';
import AttendanceManagement from './AttendanceManagement';
import { useAuth } from '../context/AuthContext';

interface PackerDashboardProps {
  selectedSection: string;
}

const PackerDashboard: React.FC<PackerDashboardProps> = ({ selectedSection }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [packingTasks, setPackingTasks] = useState<any[]>([]);
  const [myLogs, setMyLogs] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskProgress, setTaskProgress] = useState<string>('');

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
          // Fetch packing logs for this packer
          if (user?.id) {
            try {
              const logsResponse = await axios.get(`http://localhost:3002/api/packing-logs?packer_id=${user.id}`, { headers });
              setMyLogs(logsResponse.data.data || []);
            } catch (error) {
              console.error('Error fetching packing logs:', error);
              setMyLogs([]);
            }
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
    setSelectedTask(item || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedItem(null);
    setSelectedTask(null);
    setTaskProgress('');
  };

  const handleUpdateProgress = async () => {
    if (!selectedTask || !taskProgress) {
      alert('Please enter the number of additional bags completed');
      return;
    }

    try {
      const additionalBags = parseInt(taskProgress);
      if (isNaN(additionalBags) || additionalBags < 0) {
        alert('Please enter a valid number of bags');
        return;
      }

      // Update the task progress
      const updatedTasks = packingTasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, completed_quantity: (task.completed_quantity || 0) + additionalBags }
          : task
      );
      setPackingTasks(updatedTasks);

      alert(`Progress updated successfully! Added ${additionalBags} bags to ${selectedTask.task_number}`);
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress. Please try again.');
    }
  };

  const handleStartTask = (task: any) => {
    setCurrentTask(task);
    setIsWorking(true);
    setWorkStartTime(new Date());
  };

  const handleStopTask = () => {
    setIsWorking(false);
    setCurrentTask(null);
    setWorkStartTime(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'paused': return 'warning';
      case 'cancelled': return 'error';
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

  const calculateProgress = (completed: number, target: number) => {
    return Math.round((completed / target) * 100);
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Packing Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Active Tasks</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {myLogs.filter(l => l.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending approvals
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Approved</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {myLogs.filter(l => l.status === 'approved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed logs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Total Bags</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                {myLogs.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.bags_packed || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bags approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: '#f44336' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Rejected</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 700 }}>
                {myLogs.filter(l => l.status === 'rejected').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need correction
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
                Recent Packing Logs
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Bags</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myLogs.slice(0, 5).map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.packing_date).toLocaleDateString()}</TableCell>
                        <TableCell>{log.bags_packed}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.status}
                            size="small"
                            color={
                              log.status === 'approved' ? 'success' :
                              log.status === 'rejected' ? 'error' :
                              'warning'
                            }
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

  const renderPackingLog = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Packing Log
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Tasks" />
            <Tab label="In Progress" />
            <Tab label="Pending" />
            <Tab label="Completed" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task ID</TableCell>
                  <TableCell>Product Type</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packingTasks
                  .filter(task => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return task.status === 'in_progress';
                    if (selectedTab === 2) return task.status === 'pending';
                    if (selectedTab === 3) return task.status === 'completed';
                    return true;
                  })
                  .map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.task_number}</TableCell>
                      <TableCell>{task.product_type}</TableCell>
                      <TableCell>{task.target_quantity}</TableCell>
                      <TableCell>{task.completed_quantity}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 100, bgcolor: '#e0e0e0', borderRadius: 1, height: 8 }}>
                            <Box 
                              sx={{ 
                                width: `${calculateProgress(task.completed_quantity, task.target_quantity)}%`, 
                                bgcolor: '#4caf50', 
                                height: '100%', 
                                borderRadius: 1 
                              }} 
                            />
                          </Box>
                          <Typography variant="body2">
                            {calculateProgress(task.completed_quantity, task.target_quantity)}%
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
                          <Tooltip title="Start Task">
                            <IconButton size="small" onClick={() => handleStartTask(task)}>
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        {task.status === 'in_progress' && (
                          <Tooltip title="Update Progress">
                            <IconButton size="small" onClick={() => handleOpenDialog('update-progress', task)}>
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

  const renderMyLogs = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        My Packing Logs
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task ID</TableCell>
                  <TableCell>Product Type</TableCell>
                  <TableCell>Quantity Packed</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Quality Score</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.task_number}</TableCell>
                    <TableCell>{log.product_type}</TableCell>
                    <TableCell>{log.quantity_packed}</TableCell>
                    <TableCell>{new Date(log.start_time).toLocaleString()}</TableCell>
                    <TableCell>{new Date(log.end_time).toLocaleString()}</TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${log.quality_score}%`} 
                        color={log.quality_score >= 95 ? 'success' : log.quality_score >= 90 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.status} 
                        color={getStatusColor(log.status) as any}
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
    </Box>
  );

  const renderTaskDetails = () => {
    if (!selectedTask) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Task Details
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Task ID</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>#{selectedTask.task_number || selectedTask.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip 
              label={selectedTask.status?.toUpperCase() || 'UNKNOWN'} 
              color={
                selectedTask.status === 'completed' ? 'success' :
                selectedTask.status === 'in_progress' ? 'warning' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Product Type</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedTask.product_type || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Target Quantity</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedTask.target_quantity || 0} bags
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Completed Quantity</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedTask.completed_quantity || 0} bags
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <Chip 
              label={selectedTask.priority?.toUpperCase() || 'NORMAL'} 
              color={
                selectedTask.priority === 'high' ? 'error' :
                selectedTask.priority === 'medium' ? 'warning' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Estimated Completion</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedTask.estimated_completion ? new Date(selectedTask.estimated_completion).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Progress Update</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={taskProgress}
              onChange={(e) => setTaskProgress(e.target.value)}
              placeholder="Update your progress on this task..."
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderUpdateProgressForm = () => {
    if (!selectedTask) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Update Progress for {selectedTask.task_number}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Product Type</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedTask.product_type || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Target Quantity</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedTask.target_quantity || 0} bags</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Current Progress</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedTask.completed_quantity || 0} / {selectedTask.target_quantity || 0} bags
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Progress Percentage</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedTask.target_quantity ? 
                Math.round(((selectedTask.completed_quantity || 0) / selectedTask.target_quantity) * 100) : 0}%
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Bags Completed"
              type="number"
              value={taskProgress}
              onChange={(e) => setTaskProgress(e.target.value)}
              placeholder="Enter number of additional bags completed"
              helperText="Enter the number of bags you've completed since last update"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Progress Notes"
              placeholder="Add any notes about your progress, quality issues, or concerns..."
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
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
        return renderOverview();
      case 'my-attendance':
        return <AttendanceManagement selectedSection={selectedSection} userRole="packer" />;
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
          {dialogType === 'view-task' && 'Task Details'}
          {dialogType === 'update-progress' && 'Update Progress'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'view-task' && renderTaskDetails()}
          {dialogType === 'update-progress' && renderUpdateProgressForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'update-progress' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleUpdateProgress}>
              Update Progress
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackerDashboard;
