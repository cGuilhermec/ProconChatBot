import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api/api';


interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
  procon_id: number;
  primeiro_acesso: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  isFirstAccess: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstAccess, setIsFirstAccess] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = apiService.getToken();
      const userData = apiService.getUser();
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(userData);
        setIsFirstAccess(userData.primeiro_acesso === true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user || null);
        setIsFirstAccess(response.user?.primeiro_acesso === true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message || 'Erro ao fazer login' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro ao fazer login' 
      };
    }
  };

  const logout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setIsFirstAccess(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setIsFirstAccess(updatedUser.primeiro_acesso === true);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      isLoading, 
      isFirstAccess,
      updateUser 
    }}>
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