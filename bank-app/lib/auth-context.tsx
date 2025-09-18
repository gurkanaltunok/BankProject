'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService, type AuthResponse } from './api';

interface User {
  id: number;
  name?: string;
  surname?: string;
  email?: string;
  roleId: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (tckn: string, password: string) => Promise<void>;
  register: (userData: RegisterUser) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuth = async () => {
      const userId = apiService.getCurrentUserId();
      const roleId = localStorage.getItem('roleId');
      
      if (userId && roleId && apiService.isAuthenticated()) {
        // Validate token with server
        const isValid = await apiService.validateToken();
        if (isValid) {
          setUser({
            id: userId,
            roleId: parseInt(roleId),
          });
        } else {
          // Token is invalid, clear user data
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (tckn: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const authResponse: AuthResponse = await apiService.login({ TCKN: tckn, Password: password });
      
      // Token'ın localStorage'a kaydedilmesini bekle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Kullanıcı bilgilerini çek
      try {
        const userInfo = await apiService.getCurrentUser();
        setUser({
          id: authResponse.UserId,
          name: userInfo.name,
          surname: userInfo.surname,
          email: userInfo.email,
          roleId: authResponse.RoleId,
        });
      } catch (userError) {
        console.error('getCurrentUser error:', userError);
        // getCurrentUser başarısız olsa bile login başarılı, sadece temel bilgileri kullan
        setUser({
          id: authResponse.UserId,
          roleId: authResponse.RoleId,
        });
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterUser): Promise<void> => {
    try {
      setLoading(true);
      await apiService.register(userData);
      // After successful registration, user needs to login
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  // Debug log
  console.log('AuthContext - user:', user, 'isAuthenticated:', !!user, 'loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
