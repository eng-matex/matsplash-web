import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper
} from '@mui/material';
import {
  Factory
} from '@mui/icons-material';

const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 3
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 4,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center',
          minWidth: 300
        }}
      >
        <Factory 
          sx={{ 
            fontSize: 64, 
            color: 'primary.main', 
            mb: 2 
          }} 
        />
        
        <Typography variant="h5" component="h1" fontWeight="bold" mb={2}>
          MatSplash
        </Typography>
        
        <CircularProgress 
          size={40} 
          sx={{ 
            color: 'primary.main',
            mb: 2
          }} 
        />
        
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoadingScreen;
