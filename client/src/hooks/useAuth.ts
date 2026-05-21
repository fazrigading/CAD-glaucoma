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
      console.log('Checking authentication status...');
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Auth check response:', response);

      if (response.ok) {
        const data = await response.json();
        console.log('Auth check data:', data);

        if (data.authenticated && data.user) {
          console.log('User is authenticated:', data.user);
          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false
          });
          localStorage.setItem('user', JSON.stringify(data.user));
          return true;
        } else {
          console.log('User is not authenticated');
        }
      } else {
        console.error('Auth check failed with status:', response.status);
      }

      // Not authenticated
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      localStorage.removeItem('user');
      return false;

    } catch (error) {
      console.error('Auth check error:', error);
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
    } catch (error) {
      console.error('Logout error:', error);
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