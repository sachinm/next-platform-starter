'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export interface User {
  name: string;
  email: string;
  age: number;
  dateOfBirth: string;
  placeOfBirth: string;
  timeOfBirth: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  handleSignIn: (userData?: User) => void;
  handleSignUp: (userData?: User) => void;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('astroUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleSignIn = (userData?: User) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('astroUser', JSON.stringify(userData));
      setIsAuthenticated(true);
      router.push('/dashboard');
      return;
    }

    const savedUser = localStorage.getItem('astroUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      router.push('/dashboard');
      return;
    }

    // No user data found; redirect to sign in.
    router.push('/signin');
  };

  const handleSignUp = (userData?: User) => {
    if (!userData) {
      router.push('/signup');
      return;
    }

    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('astroUser', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
    router.push('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('astroUser');
    localStorage.removeItem('authToken');
    deleteCookie('authToken');
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        handleSignIn,
        handleSignUp,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;