import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authService } from '../services/api';

// Define the User type
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Define the AuthContext type
export interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setIsLoading(true);
          const response = await authService.getCurrentUser();
          setCurrentUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('token');
          console.error('Authentication check failed', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuthentication();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.register(name, email, password);
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      localStorage.removeItem('token');
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout failed', error);
      // Still remove token and user on error
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    isLoading,
    setIsLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 