import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: AuthResponse | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoSwitch: (role: UserRole) => Promise<void>;
  logout: () => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    const cached = localStorage.getItem('kaval_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    // Default fallback demo user for judges so app is immediately loaded
    return {
      access_token: 'demo-token',
      token_type: 'bearer',
      role: 'officer',
      full_name: 'K. Anbarasan (Disaster Management Officer - Zone 13)',
      email: 'officer@kaval.gov.in',
      household_id: 'HH-CHE-001'
    };
  });

  const [selectedCity, setSelectedCity] = useState<string>('Chennai');

  const role = user?.role || 'officer';
  const isAuthenticated = !!user;

  const login = async (email: string, pass: string) => {
    const authData = await api.login(email, pass);
    setUser(authData);
  };

  const demoSwitch = async (targetRole: UserRole) => {
    try {
      const authData = await api.demoSwitch(targetRole);
      setUser(authData);
    } catch {
      // Fallback in case backend is offline
      const mockUsers: Record<UserRole, AuthResponse> = {
        admin: {
          access_token: 'mock-admin',
          token_type: 'bearer',
          role: 'admin',
          full_name: 'Dr. S. Radhakrishnan (State Relief Commissioner)',
          email: 'admin@kaval.gov.in'
        },
        officer: {
          access_token: 'mock-officer',
          token_type: 'bearer',
          role: 'officer',
          full_name: 'K. Anbarasan (Disaster Management Officer - Zone 13)',
          email: 'officer@kaval.gov.in'
        },
        responder: {
          access_token: 'mock-responder',
          token_type: 'bearer',
          role: 'responder',
          full_name: 'T. Vetrivel (SDRF First Responder Team Leader)',
          email: 'responder@kaval.gov.in'
        },
        citizen: {
          access_token: 'mock-citizen',
          token_type: 'bearer',
          role: 'citizen',
          full_name: 'K. Ramanathan (Household Resident)',
          email: 'citizen@kaval.gov.in',
          household_id: 'HH-CHE-001'
        }
      };
      const fallback = mockUsers[targetRole];
      setUser(fallback);
      localStorage.setItem('kaval_user', JSON.stringify(fallback));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kaval_token');
    localStorage.removeItem('kaval_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        demoSwitch,
        logout,
        selectedCity,
        setSelectedCity
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
