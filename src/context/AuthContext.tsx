import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
// Define all types locally to avoid import issues
interface User {
  id: number;
  email: string;
  phone?: string;
  name: string;
  role: 'Admin' | 'Director' | 'Manager' | 'Receptionist' | 'StoreKeeper' | 'Packer' | 'Driver' | 'Driver Assistant' | 'Sales' | 'Security' | 'Cleaner' | 'Operator' | 'Loader';
  pin?: string;
  isEmployee: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  first_login?: boolean;
  salary_type?: 'fixed' | 'commission';
  fixed_salary?: number;
  commission_rate?: number;
  can_access_remotely?: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

interface LoginRequest {
  emailOrPhone: string;
  pin: string;
}

  interface LoginResponse {
    success: boolean;
    user?: User;
    token?: string;
    message?: string;
    requiresTwoFactor?: boolean;
  }
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
const API_BASE_URL = 'http://localhost:3002/api';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    console.log('🔍 Loading user from localStorage:', parsedUser);
    if (parsedUser) {
      console.log('🔍 Loaded user ID:', parsedUser.id);
      console.log('🔍 Loaded user role:', parsedUser.role);
      console.log('🔍 Loaded user email:', parsedUser.email);
    }
    return parsedUser;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const refreshAttemptedRef = useRef<boolean>(false);
  
  // Update ref when lastActivity changes
  useEffect(() => {
    lastActivityRef.current = lastActivity;
  }, [lastActivity]);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Auto-logout after 5 minutes of inactivity
  const AUTO_LOGOUT_TIME = 5 * 60 * 1000; // 5 minutes

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Set up axios response interceptor to handle token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && isAuthenticated) {
          console.log('Token expired, logging out');
          logout(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [isAuthenticated]);

  // Auto-logout and token refresh logic
  useEffect(() => {
    console.log('Auto-logout useEffect triggered, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping auto-logout setup');
      return;
    }

    console.log(`Setting up auto-logout with ${AUTO_LOGOUT_TIME / 1000 / 60} minute timeout`);

    const checkTokenExpiry = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      console.log(`🔍 Auto-logout check: ${Math.round(timeSinceLastActivity / 1000)}s since last activity (limit: ${AUTO_LOGOUT_TIME / 1000}s)`);

        // If user has been inactive for more than 5 minutes, logout
      if (timeSinceLastActivity > AUTO_LOGOUT_TIME) {
        console.log('🚪 Auto-logout due to inactivity');
        logout(true);
        return;
      }

      // Only check token expiry if we're close to the auto-logout time
      if (token && timeSinceLastActivity > (AUTO_LOGOUT_TIME - 30000)) { // 30 seconds before auto-logout
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tokenExpiry = payload.exp * 1000;
          const timeUntilExpiry = tokenExpiry - now;
          console.log(`🔍 Token expiry check: ${Math.round(timeUntilExpiry / 1000)}s until expiry`);
          
          if (now > tokenExpiry) {
            console.log('⏰ Token expired, logging out');
            logout(true);
            return;
          }
        } catch (error) {
          console.log('❌ Invalid token, logging out');
          logout(true);
          return;
        }
      }

        // Try to refresh token only if we haven't attempted it yet and we're close to expiry
        if (!refreshAttemptedRef.current && timeSinceLastActivity > (4 * 60 * 1000)) {
          refreshAttemptedRef.current = true;
          try {
            console.log('🔄 Attempting token refresh...');
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`);
            if (response.data.success) {
              const newToken = response.data.token;
              setToken(newToken);
              localStorage.setItem('token', newToken);
              axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              console.log('✅ Token refreshed successfully');
              // Reset the refresh flag and activity time
              refreshAttemptedRef.current = false;
              lastActivityRef.current = Date.now();
              setLastActivity(Date.now());
            }
          } catch (error) {
            console.log('❌ Token refresh failed, logging out');
            logout();
          }
        }
    };

    // Check every 10 seconds for auto-logout
    console.log('⏰ Starting auto-logout interval (every 10 seconds)');
    const interval = setInterval(checkTokenExpiry, 10000);

    return () => {
      console.log('🧹 Cleaning up auto-logout interval');
      clearInterval(interval);
    };
  }, [isAuthenticated, token]);

  // Track user activity
  useEffect(() => {
    console.log('Activity tracking useEffect triggered, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping activity tracking');
      return;
    }

    console.log('Setting up activity tracking');

    const updateActivity = () => {
      const now = Date.now();
      setLastActivity(now);
      lastActivityRef.current = now;
      refreshAttemptedRef.current = false; // Reset refresh flag on activity
      console.log('👆 User activity detected:', new Date(now).toLocaleTimeString());
    };

    // Track mouse movement, clicks, and keyboard activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [isAuthenticated]);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          console.log('🔑 Restored user from localStorage:', userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest, twoFactorCode?: string): Promise<LoginResponse> => {
    try {
      setIsLoading(true);
      
      // Get enhanced device information including network adapters
      const { getEnhancedDeviceInfo } = await import('../utils/networkUtils');
      const deviceInfo = await getEnhancedDeviceInfo();

      // Get actual user location
      let location;
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
          accuracy: position.coords.accuracy
        };
        console.log('Real location detected:', location);
      } catch (geoError) {
        console.log('Geolocation failed, using fallback location:', geoError);
        // Fallback to a location that should be denied (Lagos)
        location = {
          lat: 6.5244, // Lagos, Nigeria (should be denied)
          lng: 3.3792,
          address: 'Lagos, Nigeria (Fallback - Should be denied)',
          accuracy: 100
        };
      }

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        ...credentials,
        location,
        deviceInfo,
        twoFactorCode
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        if (response.data.token) {
          // Regular login
          console.log('🔑 Setting user data:', response.data.user);
          console.log('🔑 User ID:', response.data.user.id);
          console.log('🔑 User Role:', response.data.user.role);
          console.log('🔑 User Email:', response.data.user.email);
          
          // Clear any existing user data first
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          setToken(response.data.token);
          setUser(response.data.user);
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          console.log('🔑 User data saved to localStorage:', JSON.parse(localStorage.getItem('user') || '{}'));
          
          // Debug token expiry
          try {
            const payload = JSON.parse(atob(response.data.token.split('.')[1]));
            const tokenExpiry = new Date(payload.exp * 1000);
            console.log('🔑 Token created, expires at:', tokenExpiry.toLocaleTimeString());
          } catch (e) {
            console.log('❌ Could not decode token for debugging');
          }
          
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
      } else if (response.data.requiresTwoFactor) {
        // 2FA required
        return {
          success: false,
          requiresTwoFactor: true,
          message: response.data.message
        };
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

  const logout = (autoLogout = false) => {
    console.log('🚪 Logout called, autoLogout:', autoLogout);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    
    if (autoLogout) {
      // Show notification for auto-logout
      console.log('You have been automatically logged out due to inactivity');
      // You can add a toast notification here if you have a notification system
    }
  };


  const changePin = async (userId: number, newPin: string): Promise<ApiResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/change-pin`, {
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
    isAuthenticated,
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
