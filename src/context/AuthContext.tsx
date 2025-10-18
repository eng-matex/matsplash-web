import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, LoginResponse, ApiResponse } from '../types';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  changePin: (userId: number, newPin: string) => Promise<ApiResponse>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        // Try to get user info from the stored token or set a default
        // For now, we'll set a default user to prevent blank screen
        setUser({
          id: 1,
          name: 'User',
          email: 'user@matsplash.com',
          role: 'Admin',
          isEmployee: false,
          isActive: true,
          createdAt: new Date().toISOString()
        });
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      setIsLoading(true);
      const response = await axios.post('/auth/login', credentials);
      
      if (response.data.success) {
        if (response.data.token) {
          // Regular login
          setToken(response.data.token);
          setUser(response.data.user);
          localStorage.setItem('token', response.data.token);
          
          return {
            success: true,
            user: response.data.user,
            token: response.data.token,
            message: response.data.message
          };
        } else if (response.data.firstLogin) {
          // First login - user needs to change PIN
          return {
            success: true,
            firstLogin: true,
            user: response.data.user,
            message: response.data.message
          };
        }
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed'
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'An unexpected error occurred'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const changePin = async (userId: number, newPin: string): Promise<ApiResponse> => {
    try {
      const response = await axios.post('/auth/change-pin', {
        userId,
        newPin
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Change PIN error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change PIN'
      };
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    changePin,
    isLoading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};