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
  Avatar,
  Stack
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Visibility,
  Pending,
  Person
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface PackingLog {
  id: number;
  packer_id: number;
  packer_first_name?: string;
  packer_last_name?: string;
  storekeeper_id?: number;
  storekeeper_first_name?: string;
  storekeeper_last_name?: string;
  manager_id?: number;
  manager_first_name?: string;
  manager_last_name?: string;
  bags_packed: number;
  packing_date: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  modification_comment?: string;
  created_at: string;
  updated_at: string;
}

interface Packer {
  id: number;
  first_name?: string;
  last_name?: string;
  name: string;
  email?: string;
}

const PackerWorkflowManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<PackingLog[]>([]);
  const [packers, setPackers] = useState<Packer[]>([]);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PackingLog | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    packer_id: '',
    bags_packed: '',
    packing_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch logs based on tab
      let endpoint = '/api/packing-logs';
      if (tabValue === 1) {
        endpoint += '?status=pending';
      } else if (tabValue === 2) {
        endpoint += '?status=approved';
      } else if (tabValue === 3) {
        endpoint += '?status=rejected';
      }

      const logsRes = await fetch(endpoint, { headers });
      const logsData = await logsRes.json();

      if (logsData.success) {
        setLogs(logsData.data);
      }

      // Fetch packers
      const packersRes = await fetch('/api/water-bags/packers', { headers });
      const packersData = await packersRes.json();

      if (packersData.success) {
        setPackers(packersData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (first?: string, last?: string, fallback?: string) => {
    if (first && last) return `${first} ${last}`;
    return fallback || 'Unknown';
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      packer_id: '',
      bags_packed: '',
      packing_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialog(false);
    setFormData({
      packer_id: '',
      bags_packed: '',
      packing_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleCreateLog = async () => {
    if (!formData.packer_id || !formData.bags_packed || !formData.packing_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/packing-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packer_id: parseInt(formData.packer_id),
          bags_packed: parseInt(formData.bags_packed),
          packing_date: formData.packing_date,
          notes: formData.notes
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Packing log created successfully!');
        handleCloseCreateDialog();
        fetchData();
      } else {
        alert('Failed to create packing log: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating packing log:', error);
      alert('Failed to create packing log');
    }
  };

  const handleOpenEditDialog = (log: PackingLog) => {
    setSelectedLog(log);
    setFormData({
      packer_id: log.packer_id.toString(),
      bags_packed: log.bags_packed.toString(),
      packing_date: log.packing_date.split('T')[0],
      notes: log.notes || ''
    });
    setEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialog(false);
    setSelectedLog(null);
  };

  const handleUpdateLog = async () => {
    if (!selectedLog) return;

    if (!formData.bags_packed || !formData.packing_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/packing-logs/${selectedLog.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bags_packed: parseInt(formData.bags_packed),
          packing_date: formData.packing_date,
          notes: formData.notes
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Packing log updated successfully!');
        handleCloseEditDialog();
        fetchData();
      } else {
        alert('Failed to update packing log: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating packing log:', error);
      alert('Failed to update packing log');
    }
  };

  const handleOpenReviewDialog = (log: PackingLog, action: 'approve' | 'reject') => {
    setSelectedLog(log);
    setRejectionComment('');
    if (action === 'reject') {
      setReviewDialog(true);
    } else {
      handleReview(action, '');
    }
  };

  const handleCloseReviewDialog = () => {
    setReviewDialog(false);
    setSelectedLog(null);
    setRejectionComment('');
  };

  const handleReview = async (action: 'approve' | 'reject', comment: string) => {
    if (!selectedLog) return;

    if (action === 'reject' && !comment) {
      alert('Please provide a rejection comment');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/packing-logs/${selectedLog.id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          comment
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Packing log ${action}d successfully!`);
        handleCloseReviewDialog();
        fetchData();
      } else {
        alert(`Failed to ${action} packing log: ` + data.message);
      }
    } catch (error) {
      console.error('Error reviewing packing log:', error);
      alert(`Failed to ${action} packing log`);
    }
  };

  const handleDeleteLog = async (log: PackingLog) => {
    if (!confirm('Are you sure you want to delete this packing log?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/packing-logs/${log.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Packing log deleted successfully!');
        fetchData();
      } else {
        alert('Failed to delete packing log: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting packing log:', error);
      alert('Failed to delete packing log');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle fontSize="small" />;
      case 'rejected':
        return <Cancel fontSize="small" />;
      case 'pending':
        return <Pending fontSize="small" />;
      default:
        return null;
    }
  };

  const canCreate = user?.role === 'StoreKeeper';
  const canEdit = (log: PackingLog) => {
    return (log.status === 'pending' || log.status === 'rejected') && 
           (user?.role === 'StoreKeeper' || user?.role === 'Admin' || user?.role === 'Director');
  };
  const canDelete = (log: PackingLog) => {
    return (log.status === 'pending' || log.status === 'rejected') && 
           (log.storekeeper_id === user?.id || user?.role === 'Admin' || user?.role === 'Director');
  };
  const canReview = user?.role === 'Manager' || user?.role === 'Admin' || user?.role === 'Director';

  const renderTable = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (logs.length === 0) {
      return (
        <Alert severity="info">
          No packing logs found
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Packer</TableCell>
              <TableCell>Bags Packed</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Storekeeper</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Rejection Comment</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.packing_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {getFullName(log.packer_first_name, log.packer_last_name, 'P').charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">
                      {getFullName(log.packer_first_name, log.packer_last_name)}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{log.bags_packed}</TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(log.status)}
                    label={log.status}
                    size="small"
                    color={getStatusColor(log.status) as any}
                  />
                </TableCell>
                <TableCell>
                  {log.storekeeper_first_name && log.storekeeper_last_name
                    ? getFullName(log.storekeeper_first_name, log.storekeeper_last_name)
                    : '-'}
                </TableCell>
                <TableCell>
                  {log.manager_first_name && log.manager_last_name
                    ? getFullName(log.manager_first_name, log.manager_last_name)
                    : '-'}
                </TableCell>
                <TableCell>
                  {log.notes ? (
                    <Tooltip title={log.notes}>
                      <Typography variant="body2" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.notes}
                      </Typography>
                    </Tooltip>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {log.modification_comment ? (
                    <Tooltip title={log.modification_comment}>
                      <Typography variant="body2" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', color: 'error.main' }}>
                        {log.modification_comment}
                      </Typography>
                    </Tooltip>
                  ) : '-'}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {log.status === 'pending' && canReview && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenReviewDialog(log, 'approve')}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenReviewDialog(log, 'reject')}
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {canEdit(log) && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEditDialog(log)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete(log) && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteLog(log)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Packer Workflow Management
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreateDialog}
          >
            Create Packing Log
          </Button>
        )}
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Logs" />
        <Tab label="Pending" />
        <Tab label="Approved" />
        <Tab label="Rejected" />
      </Tabs>

      {renderTable()}

      {/* Create Dialog */}
      <Dialog open={createDialog} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Packing Log</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Packer</InputLabel>
                <Select
                  value={formData.packer_id}
                  onChange={(e) => setFormData({ ...formData, packer_id: e.target.value })}
                >
                  {packers.map((packer) => (
                    <MenuItem key={packer.id} value={packer.id}>
                      {getFullName(packer.first_name, packer.last_name, packer.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bags Packed"
                type="number"
                value={formData.bags_packed}
                onChange={(e) => setFormData({ ...formData, bags_packed: e.target.value })}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Packing Date"
                type="date"
                value={formData.packing_date}
                onChange={(e) => setFormData({ ...formData, packing_date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateLog} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Packing Log</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bags Packed"
                type="number"
                value={formData.bags_packed}
                onChange={(e) => setFormData({ ...formData, bags_packed: e.target.value })}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Packing Date"
                type="date"
                value={formData.packing_date}
                onChange={(e) => setFormData({ ...formData, packing_date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateLog} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Comment Dialog */}
      <Dialog open={reviewDialog} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Packing Log</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please provide a reason for rejection. This will be visible to the storekeeper.
          </Typography>
          <TextField
            fullWidth
            label="Rejection Comment"
            multiline
            rows={4}
            value={rejectionComment}
            onChange={(e) => setRejectionComment(e.target.value)}
            required
            sx={{ mt: 2 }}
            placeholder="Explain what needs to be fixed..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>Cancel</Button>
          <Button
            onClick={() => handleReview('reject', rejectionComment)}
            variant="contained"
            color="error"
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackerWorkflowManagement;

