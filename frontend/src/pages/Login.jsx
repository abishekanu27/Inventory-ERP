import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [role, setRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(role, password);
    if (!success) {
      setError('Invalid password for selected role');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117', color: 'white' }}>
      <form className="card" onSubmit={handleLogin} style={{ width: '400px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#161b22', border: '1px solid #30363d' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👕</div>
          <h1 style={{ margin: 0 }}>Velmora ERP</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Secure POS Verification</p>
        </div>

        {error && <div style={{ color: '#ff7b72', padding: '1rem', backgroundColor: 'rgba(218, 54, 51, 0.1)', border: '1px solid rgba(218, 54, 51, 0.4)', borderRadius: '6px', textAlign: 'center' }}>{error}</div>}

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}><User size={16}/> Access Level</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', background: '#0d1117', color: 'white', border: '1px solid #30363d', fontSize: '1rem' }}>
            <option value="admin">Administrator (Full Access)</option>
            <option value="staff">Sales Staff (Billing Only)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}><Lock size={16}/> Protocol Pin</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={`Hint: ${role}123`} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', background: '#0d1117', color: 'white', border: '1px solid #30363d', fontSize: '1rem' }} />
        </div>

        <button type="submit" style={{ width: '100%', padding: '1rem', marginTop: '1rem', backgroundColor: '#2f81f7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
          Initialize Terminal
        </button>
      </form>
    </div>
  );
};

export default Login;
