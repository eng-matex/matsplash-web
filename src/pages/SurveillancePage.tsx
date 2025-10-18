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
  Fab,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Videocam,
  VideocamOff,
  Security,
  LocationOn,
  Settings,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Camera } from '../types';
import axios from 'axios';

const SurveillancePage: React.FC = () => {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [newCamera, setNewCamera] = useState({
    name: '',
    ip_address: '',
    port: 80,
    username: '',
    password: '',
    location: '',
    model: '',
    manufacturer: ''
  });

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const response = await axios.get('/surveillance/cameras');
      if (response.data.success) {
        setCameras(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCamera = async () => {
    try {
      const cameraData = {
        ...newCamera,
        stream_url: `http://${newCamera.ip_address}:${newCamera.port}/video`,
        status: 'offline'
      };

      const response = await axios.post('/surveillance/cameras', cameraData);
      if (response.data.success) {
        setAddDialogOpen(false);
        setNewCamera({
          name: '',
          ip_address: '',
          port: 80,
          username: '',
          password: '',
          location: '',
          model: '',
          manufacturer: ''
        });
        fetchCameras();
      }
    } catch (error) {
      console.error('Error adding camera:', error);
    }
  };

  const handleEditCamera = async () => {
    if (!selectedCamera) return;
    
    try {
      const response = await axios.put(`/surveillance/cameras/${selectedCamera.id}`, selectedCamera);
      if (response.data.success) {
        setEditDialogOpen(false);
        setSelectedCamera(null);
        fetchCameras();
      }
    } catch (error) {
      console.error('Error updating camera:', error);
    }
  };

  const handleDeleteCamera = async (cameraId: number) => {
    if (!window.confirm('Are you sure you want to delete this camera?')) return;
    
    try {
      const response = await axios.delete(`/surveillance/cameras/${cameraId}`);
      if (response.data.success) {
        fetchCameras();
      }
    } catch (error) {
      console.error('Error deleting camera:', error);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'success' : 'error';
  };

  const getStatusIcon = (status: string) => {
    return status === 'online' ? <Videocam color="success" /> : <VideocamOff color="error" />;
  };

  const canManageSurveillance = ['Admin', 'Manager', 'Director', 'Security'].includes(user?.role || '');

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Surveillance Center
        </Typography>
        {canManageSurveillance && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Camera
          </Button>
        )}
      </Box>

      {/* Surveillance Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Videocam color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Cameras</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {cameras.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Installed cameras
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Videocam color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Online Cameras</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {cameras.filter(camera => camera.status === 'online').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VideocamOff color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Offline Cameras</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {cameras.filter(camera => camera.status === 'offline').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Security Status</Typography>
              </Box>
              <Chip
                label={cameras.filter(camera => camera.status === 'online').length > 0 ? 'Active' : 'Inactive'}
                color={cameras.filter(camera => camera.status === 'online').length > 0 ? 'success' : 'error'}
                size="large"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cameras List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Camera Management
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Camera</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Last Seen</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cameras.map((camera) => (
                  <TableRow key={camera.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(camera.status)}
                        <Box>
                          <Typography variant="subtitle2">{camera.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {camera.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" />
                        <Typography variant="body2">
                          {camera.location || 'Not specified'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {camera.ip_address}:{camera.port}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={camera.status.toUpperCase()}
                        color={getStatusColor(camera.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {camera.manufacturer} {camera.model}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {camera.last_seen ? new Date(camera.last_seen).toLocaleString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Stream">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedCamera(camera);
                            setViewDialogOpen(true);
                          }}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      {canManageSurveillance && (
                        <>
                          <Tooltip title="Edit Camera">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedCamera(camera);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Camera">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCamera(camera.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Camera Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Camera</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Camera Name"
                value={newCamera.name}
                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={newCamera.location}
                onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="IP Address"
                value={newCamera.ip_address}
                onChange={(e) => setNewCamera({ ...newCamera, ip_address: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Port"
                type="number"
                value={newCamera.port}
                onChange={(e) => setNewCamera({ ...newCamera, port: parseInt(e.target.value) || 80 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={newCamera.username}
                onChange={(e) => setNewCamera({ ...newCamera, username: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newCamera.password}
                onChange={(e) => setNewCamera({ ...newCamera, password: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                value={newCamera.manufacturer}
                onChange={(e) => setNewCamera({ ...newCamera, manufacturer: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={newCamera.model}
                onChange={(e) => setNewCamera({ ...newCamera, model: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCamera} variant="contained">
            Add Camera
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Camera Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Camera</DialogTitle>
        <DialogContent>
          {selectedCamera && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Camera Name"
                  value={selectedCamera.name}
                  onChange={(e) => setSelectedCamera({ ...selectedCamera, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={selectedCamera.location || ''}
                  onChange={(e) => setSelectedCamera({ ...selectedCamera, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={selectedCamera.ip_address}
                  onChange={(e) => setSelectedCamera({ ...selectedCamera, ip_address: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Port"
                  type="number"
                  value={selectedCamera.port}
                  onChange={(e) => setSelectedCamera({ ...selectedCamera, port: parseInt(e.target.value) || 80 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={selectedCamera.username}
                  onChange={(e) => setSelectedCamera({ ...selectedCamera, username: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={selectedCamera.password}
                  onChange={(e) => setSelectedCamera({ ...selectedCamera, password: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Manufacturer"
                  value={selectedCamera.manufacturer || ''}
                  onChange={(e) => setSelectedCamera({ ...selectedCamera, manufacturer: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={selectedCamera.model || ''}
                  onChange={(e) => setSelectedCamera({ ...selectedCamera, model: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCamera} variant="contained">
            Update Camera
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Stream Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Camera Stream - {selectedCamera?.name}</DialogTitle>
        <DialogContent>
          {selectedCamera && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Camera stream functionality would be implemented here. This would connect to the actual camera feed.
              </Alert>
              <Box sx={{ 
                width: '100%', 
                height: '400px', 
                backgroundColor: '#f5f5f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px dashed #ccc'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Videocam sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Camera Stream Placeholder
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCamera.ip_address}:{selectedCamera.port}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SurveillancePage;
