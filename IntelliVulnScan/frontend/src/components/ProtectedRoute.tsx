import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../services/api';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { currentUser, setCurrentUser, isLoading, setIsLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsVerifying(false);
        return;
      }

      if (!currentUser) {
        try {
          setIsLoading(true);
          const response = await authService.getCurrentUser();
          setCurrentUser(response.data.user);
        } catch (error) {
          // Invalid token or server error
          localStorage.removeItem('token');
        } finally {
          setIsLoading(false);
          setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [currentUser, setCurrentUser, setIsLoading]);

  if (isVerifying || isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return localStorage.getItem('token') ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoute; 