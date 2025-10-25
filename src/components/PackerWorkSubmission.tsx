import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
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
  Edit
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface Assignment {
  id: number;
  batch_number: string;
  bags_assigned: number;
  status: string;
  created_at: string;
}

interface WorkLog {
  id: number;
  batch_number: string;
  bags_assigned: number;
  bags_packed: number;
  status: string;
  modification_comment?: string;
  created_at: string;
}

const PackerWorkSubmission: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [bagsPacked, setBagsPacked] = useState('');

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

      // Fetch assignments for this packer
      const assignmentsRes = await fetch(`/api/water-bags/assignments?packer_id=${user?.id}`, { headers });
      const assignmentsData = await assignmentsRes.json();

      // Fetch work logs for this packer
      const workLogsRes = await fetch(`/api/water-bags/work-logs?packer_id=${user?.id}`, { headers });
      const workLogsData = await workLogsRes.json();

      if (assignmentsData.success) setAssignments(assignmentsData.data);
      if (workLogsData.success) setWorkLogs(workLogsData.data);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!selectedAssignment || !bagsPacked) return;

    const bagsPackedNum = parseInt(bagsPacked);
    if (bagsPackedNum > selectedAssignment.bags_assigned) {
      alert('Cannot pack more bags than assigned');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/water-bags/work-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignment_id: selectedAssignment.id,
          packer_id: user?.id,
          bags_packed: bagsPackedNum
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Work log submitted successfully!');
        setSubmitDialog(false);
        setSelectedAssignment(null);
        setBagsPacked('');
        fetchData();
      } else {
        alert('Failed to submit work log: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting work log:', error);
      alert('Failed to submit work log');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned':
        return 'warning';
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle color="success" />;
      case 'pending':
        return <Pending color="warning" />;
      case 'rejected':
        return <Warning color="error" />;
      default:
        return <Assignment />;
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
        My Packing Assignments
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        View your assigned water bag batches and submit your packing work for manager approval.
      </Alert>

      {/* Active Assignments */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Active Assignments" 
          action={
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchData}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          <List>
            {assignments.filter(a => a.status === 'assigned').length === 0 ? (
              <ListItem>
                <ListItemText primary="No active assignments" />
              </ListItem>
            ) : (
              assignments
                .filter(a => a.status === 'assigned')
                .map((assignment) => (
                  <ListItem key={assignment.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            Batch: {assignment.batch_number}
                          </Typography>
                          <Chip
                            size="small"
                            color={getStatusColor(assignment.status)}
                            label={assignment.status}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2">
                          Bags Assigned: {assignment.bags_assigned} | 
                          Date: {new Date(assignment.created_at).toLocaleString()}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setSubmitDialog(true);
                        }}
                      >
                        Submit Work
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
            )}
          </List>
        </CardContent>
      </Card>

      {/* Work Logs History */}
      <Card>
        <CardHeader 
          title="My Work Logs" 
          action={
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchData}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Batch</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Packed</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Comments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No work logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  workLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.batch_number}</TableCell>
                      <TableCell>{log.bags_assigned}</TableCell>
                      <TableCell>{log.bags_packed}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(log.status)}
                          <Chip
                            size="small"
                            color={getStatusColor(log.status)}
                            label={log.status}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.modification_comment && (
                          <Tooltip title={log.modification_comment}>
                            <IconButton size="small">
                              <Warning color="warning" />
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

      {/* Submit Work Dialog */}
      <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Packing Work</DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Batch: {selectedAssignment.batch_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bags Assigned: {selectedAssignment.bags_assigned}
              </Typography>
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bags Packed"
                type="number"
                value={bagsPacked}
                onChange={(e) => setBagsPacked(e.target.value)}
                required
                inputProps={{ 
                  max: selectedAssignment?.bags_assigned,
                  min: 0
                }}
                helperText={`Maximum: ${selectedAssignment?.bags_assigned} bags`}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitWork} 
            variant="contained"
            disabled={!bagsPacked || parseInt(bagsPacked) > (selectedAssignment?.bags_assigned || 0)}
          >
            Submit Work
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackerWorkSubmission;
