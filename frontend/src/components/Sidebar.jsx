import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, Settings, Users, Truck, ShoppingBag, BarChart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user && user.role === 'admin';

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="sidebar-logo">
        <img src="/Velmora-1.jpg" alt="Velmora Logo" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
        <span style={{ marginLeft: '10px' }}>Velmora</span>
      </div>
      <nav style={{ flex: 1 }}>
        <ul className="nav-links">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Package size={20} />
              Products
            </NavLink>
          </li>
          <li>
            <NavLink to="/billing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              Billing
            </NavLink>
          </li>
          <li>
            <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              Customers
            </NavLink>
          </li>
          {isAdmin && (
            <>
              <li>
                <NavLink to="/suppliers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Truck size={20} />
                  Suppliers
                </NavLink>
              </li>
              <li>
                <NavLink to="/purchases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <ShoppingBag size={20} />
                  Purchases
                </NavLink>
              </li>
              <li>
                <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <BarChart size={20} />
                  Reports
                </NavLink>
              </li>
            </>
          )}
          <li className="mobile-nav-logout">
            <div className="nav-item" onClick={logout} style={{ cursor: 'pointer', color: '#ff7b72' }}>
              <LogOut size={20} />
              <span style={{ textTransform: 'capitalize' }}>Logout ({user?.role})</span>
            </div>
          </li>
        </ul>
      </nav>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Logged in as: <br/><strong style={{color:'white', textTransform: 'capitalize'}}>{user?.role}</strong></div>
        <button onClick={logout} style={{ width: '100%', background: 'transparent', color: '#ff7b72', border: '1px solid #ff7b72', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> Disconnect
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
