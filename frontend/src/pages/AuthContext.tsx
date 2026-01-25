import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

type User = {
  id: string;
  username: string;
  is_admin: boolean;
};

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Restore admin status on mount
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const me: any = await api.request('/api/me');
        if (me) {
          setUser({
            id: me.id,
            username: me.name || me.username || '',
            is_admin: me.is_admin || false,
          });
        }
      } catch (e) {
        console.warn('Failed to restore auth from token', e);
      }
    };

    restoreAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
