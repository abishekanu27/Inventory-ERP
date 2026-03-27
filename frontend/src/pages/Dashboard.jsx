import { useState, useEffect } from 'react';
import { TrendingUp, Package, FileText, IndianRupee, AlertTriangle } from 'lucide-react';
import { fetchProducts, fetchInvoices } from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalStock: 0,
    totalProducts: 0,
    totalInvoices: 0
  });
  
  const [lowStockWarnings, setLowStockWarnings] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const [products, invoices] = await Promise.all([
        fetchProducts(),
        fetchInvoices()
      ]);

      let totalStock = 0;
      let warnings = [];

      products.forEach(p => {
        if (p.variants) {
          p.variants.forEach(v => {
            totalStock += v.stock;
            if (v.stock < 10) {
              warnings.push(`${p.name} - ${v.size} (${v.color}) has only ${v.stock} units left`);
            }
          });
        }
      });

      const totalSales = invoices.reduce((acc, curr) => acc + curr.total_amount, 0);

      setStats({
        totalSales,
        totalStock,
        totalProducts: products.length,
        totalInvoices: invoices.length
      });
      setLowStockWarnings(warnings);
    };
    loadDashboardData();
  }, []);

  return (
    <div className="page fade-in">
      <header className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Welcome back to Velmora.</p>
      </header>

      {lowStockWarnings.length > 0 && (
        <div style={{ backgroundColor: 'rgba(218, 54, 51, 0.1)', borderLeft: '4px solid var(--danger)', padding: '1rem', marginBottom: '2rem', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff7b72', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} /> Low Stock Warnings ({lowStockWarnings.length})
          </div>
          <ul style={{ paddingLeft: '2rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {lowStockWarnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
            {lowStockWarnings.length > 5 && <li>...and {lowStockWarnings.length - 5} more</li>}
          </ul>
        </div>
      )}

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon-wrapper" style={{color: 'var(--accent-color)'}}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div className="stat-title">Total Sales</div>
            <div className="stat-value">₹{stats.totalSales.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-wrapper" style={{color: 'var(--success)'}}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-title">Total Invoices</div>
            <div className="stat-value">{stats.totalInvoices}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-wrapper" style={{color: '#f6c343'}}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-title">Total Stock</div>
            <div className="stat-value">{stats.totalStock} Items</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-wrapper" style={{color: '#bc8cff'}}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-title">Product Types</div>
            <div className="stat-value">{stats.totalProducts}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
