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
    const checkAuth = async () => {
      const userId = apiService.getCurrentUserId();
      const roleId = localStorage.getItem('roleId');
      
      if (userId && roleId && apiService.isAuthenticated()) {
        const isValid = await apiService.validateToken();
        if (isValid) {
          // localStorage'dan kullanıcı bilgilerini yükle
          const name = localStorage.getItem('userName');
          const surname = localStorage.getItem('userSurname');
          const email = localStorage.getItem('userEmail');
          
          setUser({
            id: userId,
            name: name || undefined,
            surname: surname || undefined,
            email: email || undefined,
            roleId: parseInt(roleId),
          });
        } else {
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
      
      // Token'ı console'a yazdır
      console.log('🔑 JWT Token:', authResponse.Token);
      console.log('👤 User ID:', authResponse.UserId);
      console.log('🔐 Role ID:', authResponse.RoleId);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const userInfo = await apiService.getCurrentUser();
        const userData = {
          id: authResponse.UserId,
          name: userInfo.name,
          surname: userInfo.surname,
          email: userInfo.email,
          roleId: authResponse.RoleId,
        };
        
        // Kullanıcı bilgilerini localStorage'a kaydet
        if (userInfo.name) localStorage.setItem('userName', userInfo.name);
        if (userInfo.surname) localStorage.setItem('userSurname', userInfo.surname);
        if (userInfo.email) localStorage.setItem('userEmail', userInfo.email);
        
        setUser(userData);
      } catch (userError) {
        console.error('getCurrentUser error:', userError);
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
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    // Kullanıcı bilgilerini localStorage'dan temizle
    localStorage.removeItem('userName');
    localStorage.removeItem('userSurname');
    localStorage.removeItem('userEmail');
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
