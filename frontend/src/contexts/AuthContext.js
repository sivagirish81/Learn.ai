import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token')); // ✅ Fixed key name
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp * 1000 < Date.now()) {
          console.log('Token expired. Logging out...');
          logout();
        } else {
          console.log('Token is valid:', decoded);
          setUser(decoded);
          setToken(storedToken);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    console.log('Logging in with token:', newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const getAuthHeaders = () => {
    console.log("jbdbskbfkdsgb")
    if (!token) {
      return { 'Content-Type': 'application/json' };
    }

    try {
      console.log('token' + token)
      const decoded = jwtDecode(token);
      console.log('dec ' + decoded)
      if (decoded.exp * 1000 < Date.now()) {
        console.log('Token expired. Logging out...');
        logout();
        return { 'Content-Type': 'application/json' };
      }
    } catch (error) {
      console.error('Token decoding failed:', error);
      logout();
      return { 'Content-Type': 'application/json' };
    }
    console.log('sfksafnlkfnklfalkgblgbl')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      token,
      login, 
      logout,
      getAuthHeaders 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('cont' + context)
  if (!context) {
    console.log('bd3')
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
