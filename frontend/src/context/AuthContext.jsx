import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cloth_erp_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (role, password) => {
    // Simple prototype auth
    if (role === 'admin' && password === 'admin123') {
      const u = { role: 'admin', name: 'Admin Administrator' };
      setUser(u);
      localStorage.setItem('cloth_erp_user', JSON.stringify(u));
      return true;
    }
    if (role === 'staff' && password === 'staff123') {
      const u = { role: 'staff', name: 'Store Staff' };
      setUser(u);
      localStorage.setItem('cloth_erp_user', JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cloth_erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
