import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from './api';
import { handleFirebaseAuth } from './firebaseAuth';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  profile?: any;
  stats?: any;
  todayGoal?: any;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  firebaseLogin: (provider: 'google' | 'github' | 'facebook' | 'twitter') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const response = await apiService.getCurrentUser();
          if (response.success) {
            setUser(response.data);
          } else {
            apiService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        apiService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      if (response.success) {
        setUser(response.data);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiService.register(name, email, password);
      if (response.success) {
        setUser(response.data);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const firebaseLogin = async (provider: 'google' | 'github' | 'facebook' | 'twitter') => {
    try {
      const response = await handleFirebaseAuth(provider);
      if (response.success) {
        setUser(response.data);
      } else {
        throw new Error('Firebase authentication failed');
      }
    } catch (error) {
      console.error('Firebase login error:', error);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    role: user?.role || null,
    login,
    register,
    firebaseLogin,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 