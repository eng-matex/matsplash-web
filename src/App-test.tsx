import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box } from '@mui/material';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            🏭 MatSplash Factory Management
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Welcome to your factory management system!
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            The application is loading successfully. If you can see this page, the frontend is working.
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default App;
