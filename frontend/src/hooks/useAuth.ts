import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  username: string;
  dr_id_number: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.authenticated && data.user) {
          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false
          });
          localStorage.setItem('user', JSON.stringify(data.user));
          return true;
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        localStorage.removeItem('user');
        return false;
      }

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      localStorage.removeItem('user');
      return false;

    } catch {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      localStorage.removeItem('user');
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore logout errors
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const requireAuth = () => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      navigate('/login', {
        state: { from: location },
        replace: true
      });
      return false;
    }
    return authState.isAuthenticated;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    checkAuth,
    logout,
    requireAuth
  };
};