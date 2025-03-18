import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { Box, Container, Alert, Button } from '@mui/material';
import axios from 'axios';

// Layout components
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Main pages
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import Scans from './pages/Scans';
import ScanDetail from './pages/ScanDetail';
import Vulnerabilities from './pages/Vulnerabilities';
import VulnerabilityDetail from './pages/VulnerabilityDetail';
import MLModels from './pages/MLModels';
import MLModelDetail from './pages/MLModelDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
// import Scanners from './pages/Scanners'; // Commented out as this file doesn't exist

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // This is a simplified version. In a real app, you would check if the user is authenticated
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const BackendConnectionCheck: React.FC = () => {
  const [connectionError, setConnectionError] = useState<boolean>(false);
  
  const checkBackendConnection = async () => {
    try {
      await axios.get('/health');
      setConnectionError(false);
    } catch (error) {
      setConnectionError(true);
    }
  };

  useEffect(() => {
    checkBackendConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(() => {
      checkBackendConnection();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!connectionError) return null;

  return (
    <Box sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 1200, p: 1 }}>
      <Alert 
        severity="error"
        variant="filled"
        action={
          <Button color="inherit" size="small" onClick={checkBackendConnection}>
            Retry
          </Button>
        }
      >
        Backend server is not responding. Please make sure the backend server is running.
      </Alert>
    </Box>
  );
};

const App: React.FC = () => {
  // Create a theme instance
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  return (
    <CustomThemeProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                {/* Auth routes */}
                <Route path="/" element={<AuthLayout />}>
                  <Route index element={<Navigate to="/login" />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="assets" element={<Assets />} />
                  <Route path="assets/:id" element={<AssetDetail />} />
                  <Route path="scans" element={<Scans />} />
                  <Route path="scans/:id" element={<ScanDetail />} />
                  <Route path="vulnerabilities" element={<Vulnerabilities />} />
                  <Route path="vulnerabilities/:id" element={<VulnerabilityDetail />} />
                  <Route path="ml-models" element={<MLModels />} />
                  <Route path="ml-models/:id" element={<MLModelDetail />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BackendConnectionCheck />
            </NotificationProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </CustomThemeProvider>
  );
};

export default App; 