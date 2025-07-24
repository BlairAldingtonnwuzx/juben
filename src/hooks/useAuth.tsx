import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { getCurrentUser, setCurrentUser } from '../utils/storage';
import { loginUser } from '../utils/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await loginUser(email, password);
    
    if (result.success && result.user) {
      setUser(result.user);
      setCurrentUser(result.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};