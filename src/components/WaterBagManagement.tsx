import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add,
  Assignment,
  CheckCircle,
  Pending,
  Warning,
  Refresh,
  Visibility,
  Edit,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`water-bag-tabpanel-${index}`}
      aria-labelledby={`water-bag-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface WaterBagBatch {
  id: number;
  batch_number: string;
  loader_name: string;
  loader_email: string;
  bags_received: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface Packer {
  id: number;
  name: string;
  email: string;
  status: string;
}

interface Loader {
  id: number;
  name: string;
  email: string;
  status: string;
}

interface Assignment {
  id: number;
  batch_id: number;
  packer_name: string;
  packer_email: string;
  bags_assigned: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface WorkLog {
  id: number;
  batch_number: string;
  packer_name: string;
  packer_email: string;
  bags_assigned: number;
  bags_packed: number;
  status: string;
  modification_comment?: string;
  created_at: string;
}

const WaterBagManagement: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<WaterBagBatch[]>([]);
  const [packers, setPackers] = useState<Packer[]>([]);
  const [loaders, setLoaders] = useState<Loader[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Assignment[]>([]);
  const [rejectedQueue, setRejectedQueue] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({
    totalBatches: 0,
    pendingAssignments: 0,
    completedWork: 0,
    pendingApprovals: 0
  });

  // Dialog states
  const [createBatchDialog, setCreateBatchDialog] = useState(false);
  const [intakeDialog, setIntakeDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [viewAssignmentsDialog, setViewAssignmentsDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<WaterBagBatch | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; id?: number; action?: 'approve' | 'reject' }>({ open: false });
  const [reviewComment, setReviewComment] = useState('');
  const [resubmitDialog, setResubmitDialog] = useState<{ open: boolean; id?: number; currentBags?: number; currentNotes?: string }>({ open: false });

  // Form states
  const [batchForm, setBatchForm] = useState({
    loader_id: '',
    bags_received: '',
    notes: ''
  });
  const [assignmentForm, setAssignmentForm] = useState({
    packer_id: '',
    bags_assigned: '',
    notes: ''
  });
  const [intakeForm, setIntakeForm] = useState({
    loader_id: '',
    packer_id: '',
    bags_submitted: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [batchesRes, packersRes, loadersRes, workLogsRes, statsRes, reviewRes, rejectedRes] = await Promise.all([
        fetch('/api/water-bags/batches', { headers }),
        fetch('/api/water-bags/packers', { headers }),
        fetch('/api/water-bags/loaders', { headers }),
        fetch('/api/water-bags/work-logs', { headers }),
        fetch('/api/water-bags/dashboard-stats', { headers }),
        fetch('/api/water-bags/assignments?status=pending_review', { headers }),
        fetch('/api/water-bags/assignments?status=rejected', { headers })
      ]);

      const [batchesData, packersData, loadersData, workLogsData, statsData, reviewData, rejectedData] = await Promise.all([
        batchesRes.json(),
        packersRes.json(),
        loadersRes.json(),
        workLogsRes.json(),
        statsRes.json(),
        reviewRes.json(),
        rejectedRes.json()
      ]);

      if (batchesData.success) setBatches(batchesData.data);
      if (packersData.success) setPackers(packersData.data);
      if (loadersData.success) setLoaders(loadersData.data);
      if (workLogsData.success) setWorkLogs(workLogsData.data);
      if (statsData.success) setStats(statsData.data);
      if (reviewData.success) setReviewQueue(reviewData.data);
      if (rejectedData.success) setRejectedQueue(rejectedData.data);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/water-bags/batches', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchForm)
      });

      const data = await response.json();
      if (data.success) {
        alert('Water bag batch created successfully!');
        setCreateBatchDialog(false);
        setBatchForm({ loader_id: '', bags_received: '', notes: '' });
        fetchData();
      } else {
        alert('Failed to create batch: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Failed to create batch');
    }
  };

  const handleAssignBags = async () => {
    if (!selectedBatch) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/water-bags/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_id: selectedBatch.id,
          ...assignmentForm
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Bags assigned successfully!');
        setAssignDialog(false);
        setAssignmentForm({ packer_id: '', bags_assigned: '', notes: '' });
        fetchData();
      } else {
        alert('Failed to assign bags: ' + data.message);
      }
    } catch (error) {
      console.error('Error assigning bags:', error);
      alert('Failed to assign bags');
    }
  };

  const handleSubmitIntake = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/water-bags/intake', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(intakeForm)
      });

      const data = await response.json();
      if (data.success) {
        alert('Intake submitted for manager review!');
        setIntakeDialog(false);
        setIntakeForm({ loader_id: '', packer_id: '', bags_submitted: '', notes: '' });
        fetchData();
      } else {
        alert('Failed to submit intake: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting intake:', error);
      alert('Failed to submit intake');
    }
  };

  const handleReviewAssignment = async () => {
    if (!reviewDialog.id || !reviewDialog.action) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/water-bags/assignments/${reviewDialog.id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: reviewDialog.action, comment: reviewComment })
      });
      const data = await response.json();
      if (data.success) {
        setReviewDialog({ open: false });
        setReviewComment('');
        fetchData();
      } else {
        alert('Failed to update submission: ' + data.message);
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
      alert('Failed to update submission');
    }
  };

  const handleResubmitAssignment = async () => {
    if (!resubmitDialog.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/water-bags/assignments/${resubmitDialog.id}/resubmit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bags_assigned: resubmitDialog.currentBags,
          notes: resubmitDialog.currentNotes
        })
      });
      const data = await response.json();
      if (data.success) {
        setResubmitDialog({ open: false });
        fetchData();
      } else {
        alert('Failed to resubmit: ' + data.message);
      }
    } catch (error) {
      console.error('Error resubmitting:', error);
      alert('Failed to resubmit');
    }
  };

  const handleViewAssignments = async (batch: WaterBagBatch) => {
    setSelectedBatch(batch);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/water-bags/batches/${batch.id}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAssignments(data.data);
        setViewAssignmentsDialog(true);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received':
        return 'info';
      case 'assigned':
        return 'warning';
      case 'packed':
        return 'success';
      case 'completed':
        return 'success';
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderBatches = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Water Bag Batches</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {user?.role?.toLowerCase() === 'storekeeper' && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setIntakeDialog(true)}
            >
              New Intake
            </Button>
          )}
          {/* Remove Create Batch per requirements */}
        </Box>
      </Box>

      <List>
        {batches.length === 0 ? (
          <ListItem>
            <ListItemText primary="No water bag batches found" />
          </ListItem>
        ) : (
          batches.map((batch) => (
            <ListItem key={batch.id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {batch.batch_number}
                    </Typography>
                    <Chip
                      size="small"
                      color={getStatusColor(batch.status)}
                      label={batch.status}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2">
                      Loader: {batch.loader_name} | Bags: {batch.bags_received} | 
                      Created: {new Date(batch.created_at).toLocaleString()}
                    </Typography>
                    {batch.notes && (
                      <Typography variant="body2" color="text.secondary">
                        Notes: {batch.notes}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="View Assignments">
                  <IconButton
                    onClick={() => handleViewAssignments(batch)}
                    color="primary"
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                {/* Assign to Packer is no longer used; submissions go via Intake */}
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );

  const renderReviewQueue = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Pending Submissions</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Batch</TableCell>
              <TableCell>Loader</TableCell>
              <TableCell>Packer</TableCell>
              <TableCell>Bags</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviewQueue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No pending submissions</TableCell>
              </TableRow>
            ) : (
              reviewQueue.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{(item as any).batch_number}</TableCell>
                  <TableCell>{(item as any).loader_name}</TableCell>
                  <TableCell>{(item as any).packer_name}</TableCell>
                  <TableCell>{item.bags_assigned}</TableCell>
                  <TableCell><Chip size="small" color={getStatusColor(item.status)} label={item.status} /></TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {user?.role === 'Manager' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" color="success" onClick={() => setReviewDialog({ open: true, id: item.id, action: 'approve' })}>Approve</Button>
                        <Button size="small" color="error" onClick={() => setReviewDialog({ open: true, id: item.id, action: 'reject' })}>Reject</Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderRejectedQueue = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Rejected Submissions</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Batch</TableCell>
              <TableCell>Loader</TableCell>
              <TableCell>Packer</TableCell>
              <TableCell>Bags</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rejectedQueue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No rejected submissions</TableCell>
              </TableRow>
            ) : (
              rejectedQueue.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{(item as any).batch_number}</TableCell>
                  <TableCell>{(item as any).loader_name}</TableCell>
                  <TableCell>{(item as any).packer_name}</TableCell>
                  <TableCell>{item.bags_assigned}</TableCell>
                  <TableCell><Chip size="small" color={getStatusColor(item.status)} label={item.status} /></TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {user?.role?.toLowerCase() === 'storekeeper' && (
                      <Button size="small" onClick={() => setResubmitDialog({ open: true, id: item.id, currentBags: item.bags_assigned, currentNotes: item.notes })}>Adjust & Resubmit</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderWorkLogs = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Packer Work Logs</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Batch</TableCell>
              <TableCell>Packer</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell>Packed</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No work logs found
                </TableCell>
              </TableRow>
            ) : (
              workLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.batch_number}</TableCell>
                  <TableCell>{log.packer_name}</TableCell>
                  <TableCell>{log.bags_assigned}</TableCell>
                  <TableCell>{log.bags_packed}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={getStatusColor(log.status)}
                      label={log.status}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.status === 'pending' && user?.role === 'Manager' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleApproveWork(log.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleApproveWork(log.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const handleApproveWork = async (logId: number, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/water-bags/work-logs/${logId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Work log ${action}d successfully!`);
        fetchData();
      } else {
        alert(`Failed to ${action} work log: ${data.message}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing work log:`, error);
      alert(`Failed to ${action} work log`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assignment />
        Water Bag Management
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage water bag batches from loaders and assign them to packers for processing.
        Track the complete workflow from receipt to approval.
      </Alert>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Batches
              </Typography>
              <Typography variant="h4">
                {stats.totalBatches}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Assignments
              </Typography>
              <Typography variant="h4">
                {stats.pendingAssignments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Work
              </Typography>
              <Typography variant="h4">
                {stats.completedWork}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Approvals
              </Typography>
              <Typography variant="h4">
                {stats.pendingApprovals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader title="Water Bag Workflow Management" />
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label={`Batches (${batches.length})`} />
              {user?.role?.toLowerCase() === 'manager' && <Tab label={`Submissions (${reviewQueue.length})`} />}
              {user?.role?.toLowerCase() === 'storekeeper' && <Tab label={`Rejected (${rejectedQueue.length})`} />}
              <Tab label={`Work Logs (${workLogs.length})`} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {renderBatches()}
          </TabPanel>

          {user?.role?.toLowerCase() === 'manager' && (
            <TabPanel value={tabValue} index={1}>
              {renderReviewQueue()}
            </TabPanel>
          )}

          {user?.role?.toLowerCase() === 'storekeeper' && (
            <TabPanel value={tabValue} index={1}>
              {renderRejectedQueue()}
            </TabPanel>
          )}

          <TabPanel value={tabValue} index={user?.role === 'Manager' ? 2 : user?.role?.toLowerCase() === 'storekeeper' ? 2 : 1}>
            {renderWorkLogs()}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Create Batch Dialog */}
      <Dialog open={createBatchDialog} onClose={() => setCreateBatchDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Water Bag Batch</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Loader</InputLabel>
                <Select
                  value={batchForm.loader_id}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, loader_id: e.target.value }))}
                >
                  {loaders.map((loader) => (
                    <MenuItem key={loader.id} value={loader.id}>
                      {loader.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bags Received"
                type="number"
                value={batchForm.bags_received}
                onChange={(e) => setBatchForm(prev => ({ ...prev, bags_received: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={batchForm.notes}
                onChange={(e) => setBatchForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this batch"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateBatchDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateBatch} variant="contained">
            Create Batch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Intake Dialog */}
      <Dialog open={intakeDialog} onClose={() => setIntakeDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Loader Intake</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Loader</InputLabel>
                <Select
                  value={intakeForm.loader_id}
                  onChange={(e) => setIntakeForm(prev => ({ ...prev, loader_id: e.target.value }))}
                >
                  {loaders.map((loader) => (
                    <MenuItem key={loader.id} value={loader.id}>
                      {loader.name} ({loader.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Packer</InputLabel>
                <Select
                  value={intakeForm.packer_id}
                  onChange={(e) => setIntakeForm(prev => ({ ...prev, packer_id: e.target.value }))}
                >
                  {packers.map((packer) => (
                    <MenuItem key={packer.id} value={packer.id}>
                      {packer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bags Submitted"
                type="number"
                value={intakeForm.bags_submitted}
                onChange={(e) => setIntakeForm(prev => ({ ...prev, bags_submitted: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={intakeForm.notes}
                onChange={(e) => setIntakeForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIntakeDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitIntake} variant="contained">Submit Intake</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Bags Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Assign Bags to Packer</DialogTitle>
        <DialogContent>
          {selectedBatch && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Batch: {selectedBatch.batch_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Bags: {selectedBatch.bags_received}
              </Typography>
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Packer</InputLabel>
                <Select
                  value={assignmentForm.packer_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, packer_id: e.target.value }))}
                >
                  {packers.map((packer) => (
                    <MenuItem key={packer.id} value={packer.id}>
                      {packer.name} ({packer.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bags to Assign"
                type="number"
                value={assignmentForm.bags_assigned}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, bags_assigned: e.target.value }))}
                required
                inputProps={{ max: selectedBatch?.bags_received }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes for this assignment"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignBags} variant="contained">
            Assign Bags
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Assignments Dialog */}
      <Dialog open={viewAssignmentsDialog} onClose={() => setViewAssignmentsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Assignments for {selectedBatch?.batch_number}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Packer</TableCell>
                  <TableCell>Bags Assigned</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.packer_name}</TableCell>
                    <TableCell>{assignment.bags_assigned}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={getStatusColor(assignment.status)}
                        label={assignment.status}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewAssignmentsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Manager Review Dialog */}
      <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{reviewDialog.action === 'approve' ? 'Approve Submission' : 'Reject Submission'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={reviewDialog.action === 'approve' ? 'Comment (optional)' : 'Reason'}
            multiline
            rows={3}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false })}>Cancel</Button>
          <Button variant="contained" color={reviewDialog.action === 'approve' ? 'success' as any : 'error' as any} onClick={handleReviewAssignment}>
            {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Storekeeper Resubmit Dialog */}
      <Dialog open={resubmitDialog.open} onClose={() => setResubmitDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust and Resubmit</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bags to Submit"
                type="number"
                value={resubmitDialog.currentBags || ''}
                onChange={(e) => setResubmitDialog(prev => ({ ...prev, currentBags: Number(e.target.value) }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={resubmitDialog.currentNotes || ''}
                onChange={(e) => setResubmitDialog(prev => ({ ...prev, currentNotes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResubmitDialog({ open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleResubmitAssignment}>Resubmit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WaterBagManagement;
