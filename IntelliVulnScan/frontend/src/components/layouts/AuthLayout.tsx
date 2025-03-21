import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}
          >
            IntelliVulnScan
          </Typography>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout; 