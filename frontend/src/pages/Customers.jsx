import React, { useState, useEffect } from 'react';
import { Users, Phone, MapPin } from 'lucide-react';
import { fetchCustomers } from '../api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchCustomers();
      // sort by highest spending
      setCustomers(data.sort((a,b) => b.total_spent - a.total_spent));
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="page fade-in">
      <header className="page-header">
        <h1 className="page-title">Customers CRM</h1>
        <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Automatically tracked online buyers and analytics.</p>
      </header>

      <div className="stats-grid">
        <div className="card">
          <div className="stat-title">Total Unique Customers</div>
          <div className="stat-value">{customers.length}</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading CRM profiles...</p>
        ) : customers.length === 0 ? (
          <div className="flex-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(47, 129, 247, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-color)' }}><Users size={48} /></div>
            <h2 style={{ marginBottom: '0.5rem' }}>No Customers Yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>They will automatically appear here once you process online invoices.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ID</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Customer Details</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Shipping Address</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Total Orders</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Lifetime Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id || c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>CLI-{(c.id || 0).toString().padStart(4, '0')}</td>
                  <td style={{ padding: '1rem' }}>
                    <strong>{c.name}</strong><br/>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={12}/> {c.phone}</span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}><MapPin size={14} style={{marginTop: '3px', flexShrink: 0}} color="var(--text-secondary)"/><span style={{whiteSpace: 'pre-wrap'}}>{c.address || 'N/A'}</span></div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{c.total_orders}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>₹{c.total_spent.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Customers;
