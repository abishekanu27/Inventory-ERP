import React, { useState, useEffect } from 'react';
import { fetchInvoices, fetchPurchases, fetchProducts } from '../api';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { IndianRupee, TrendingUp, TrendingDown, Package } from 'lucide-react';

const Reports = () => {
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [invs, purs, prods] = await Promise.all([
        fetchInvoices(),
        fetchPurchases(),
        fetchProducts()
      ]);
      setInvoices(invs || []);
      setPurchases(purs || []);
      setProducts(prods || []);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="page fade-in" style={{padding: '2rem', color: 'var(--text-secondary)'}}>Loading extensive analytics payload...</div>;

  // 1. KPI MATH EVALUATED IN MEMORY
  const totalRevenue = invoices.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalCost = purchases.reduce((acc, curr) => acc + curr.total_cost, 0);
  const totalProfit = totalRevenue - totalCost;

  let physicalStockValue = 0;
  products.forEach(p => {
    if(p.variants) {
      p.variants.forEach(v => {
        physicalStockValue += v.stock * p.price; 
      });
    }
  });

  // 2. DAILY SALES PROCESSING
  const dailyGroups = {};
  invoices.forEach(inv => {
    const dateObj = new Date(inv.created_at);
    // Standardizing formats mapping natively to days
    const dayKey = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); 
    if (!dailyGroups[dayKey]) dailyGroups[dayKey] = 0;
    dailyGroups[dayKey] += inv.total_amount;
  });
  
  // Extract strictly last logged boundaries
  const dailySalesData = Object.keys(dailyGroups).map(k => ({ date: k, Sales: dailyGroups[k] })).slice(-10);

  // 3. MONTHLY SALES PROCESSING (Adding P&L Spreads)
  const monthlyGroups = {};
  
  invoices.forEach(inv => {
    const dateObj = new Date(inv.created_at);
    const mKey = dateObj.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    if (!monthlyGroups[mKey]) monthlyGroups[mKey] = { Revenue: 0, Expenses: 0 };
    monthlyGroups[mKey].Revenue += inv.total_amount;
  });
  
  purchases.forEach(pur => {
    const dateObj = new Date(pur.date);
    const mKey = dateObj.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    if (!monthlyGroups[mKey]) monthlyGroups[mKey] = { Revenue: 0, Expenses: 0 };
    monthlyGroups[mKey].Expenses += pur.total_cost;
  });

  const monthlyData = Object.keys(monthlyGroups).map(k => ({
    month: k,
    Revenue: monthlyGroups[k].Revenue,
    Expenses: monthlyGroups[k].Expenses
  }));

  // 4. DEALER / MATERIAL EXPENDITURE PROCESSING
  const dealerGroups = {};
  purchases.forEach(pur => {
    const dName = pur.supplier_name || 'Unknown Supplier';
    if (!dealerGroups[dName]) dealerGroups[dName] = 0;
    dealerGroups[dName] += pur.total_cost;
  });
  const dealerData = Object.keys(dealerGroups).map(k => ({ name: k, amount: dealerGroups[k] })).sort((a,b) => b.amount - a.amount);

  // 5. PRODUCT PERFORMANCE
  const productGroups = {};
  invoices.forEach(inv => {
    if(inv.items && Array.isArray(inv.items)) {
      inv.items.forEach(it => {
        const pName = `${it.name} (${it.size || 'N/A'}) - ${it.color || 'N/A'}`;
        if (!productGroups[pName]) productGroups[pName] = { qty: 0, revenue: 0 };
        productGroups[pName].qty += Number(it.qty) || 0;
        productGroups[pName].revenue += (Number(it.qty) * Number(it.price)) || 0;
      });
    }
  });
  const productData = Object.keys(productGroups).map(k => ({ name: k, qty: productGroups[k].qty, revenue: productGroups[k].revenue })).sort((a,b) => b.revenue - a.revenue);

  const downloadCSV = (filename, headers, rows) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDaily = () => {
    const headers = ['Date', 'Total Sales'];
    const rows = dailySalesData.map(d => [d.date, d.Sales]);
    downloadCSV('daily_velocity', headers, rows);
  };

  const exportMonthly = () => {
    const headers = ['Month', 'Revenue', 'Expenses'];
    const rows = monthlyData.map(d => [d.month, d.Revenue, d.Expenses]);
    downloadCSV('monthly_operations', headers, rows);
  };

  const exportSuppliers = () => {
    const headers = ['Supplier Name', 'Total Expenditure'];
    const rows = dealerData.map(d => [`"${d.name}"`, d.amount]);
    downloadCSV('supplier_expenditure', headers, rows);
  };

  const exportProducts = () => {
    const headers = ['Product/Variant', 'Quantity Sold', 'Revenue Generated'];
    const rows = productData.map(d => [`"${d.name}"`, d.qty, d.revenue]);
    downloadCSV('product_performance', headers, rows);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice ID', 'Date', 'Customer Name', 'Phone', 'Subtotal', 'Discount %', 'Discount Amount', 'Total Amount', 'Payment Mode'];
    const rows = invoices.map(i => [
      `INV-${i.id.toString().padStart(4, '0')}`,
      new Date(i.created_at).toLocaleDateString(),
      `"${i.customer_name || ''}"`,
      i.customer_phone || '',
      i.subtotal,
      i.discount_pct,
      i.discount,
      i.total_amount,
      i.payment_mode
    ]);
    downloadCSV('global_sales_db', headers, rows);
  };

  return (
    <div className="page fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Analytics Engine</h1>
          <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Financial intelligence diagnostics and asset logistics tracking.</p>
        </div>
        <button onClick={handleExportCSV} style={{ backgroundColor: '#21262d', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          📤 Export to Excel (.CSV)
        </button>
      </header>

      {/* DYNAMIC METRICS BOARD */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card" style={{ borderColor: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)', borderWidth: '1px', borderStyle: 'solid' }}>
          <div className="stat-icon-wrapper" style={{color: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)'}}>
             {totalProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div>
            <div className="stat-title">Net Cash Flow (Profit)</div>
            <div className="stat-value" style={{color: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)'}}>₹{totalProfit.toLocaleString('en-IN')}</div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon-wrapper" style={{color: 'var(--accent-color)'}}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div className="stat-title">Overall Revenue</div>
            <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper" style={{color: '#f6c343'}}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-title">Stock Valuation</div>
            <div className="stat-value">₹{physicalStockValue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* DAILY GRAPH */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
           <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Daily Sales Velocity</h3>
             <button onClick={exportDaily} style={{ background: '#21262d', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>CSV 📥</button>
           </div>
           <div style={{ width: '100%', height: '300px', flex: 1 }}>
             {dailySalesData.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <AreaChart data={dailySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2c323c" vertical={false} />
                   <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                   <Tooltip contentStyle={{ backgroundColor: '#21262d', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} itemStyle={{ color: 'var(--accent-color)', fontWeight: 'bold' }} />
                   <Area type="monotone" dataKey="Sales" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div style={{ height: '100%', display: 'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>No daily metrics recorded yet</div>
             )}
           </div>
        </div>

        {/* MONTHLY METRICS */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
           <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Monthly Operation Splits</h3>
             <button onClick={exportMonthly} style={{ background: '#21262d', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>CSV 📥</button>
           </div>
           <div style={{ width: '100%', height: '300px', flex: 1 }}>
             {monthlyData.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2c323c" vertical={false} />
                   <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                   <Tooltip contentStyle={{ backgroundColor: '#21262d', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} cursor={{fill: '#2c323c', opacity: 0.4}} />
                   <Bar dataKey="Revenue" fill="var(--success)" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="Expenses" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div style={{ height: '100%', display: 'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>No monthly operations active</div>
             )}
           </div>
        </div>
      </div>
      {/* ANALYTICS GRID: PRODUCTS vs. VENDORS */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* TOP PRODUCT REPORT */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', width: '100%' }}>
           <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Product Sales Performance</h3>
             <button onClick={exportProducts} style={{ background: '#21262d', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>CSV 📥</button>
           </div>
           <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                 <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                   <th style={{ padding: '0.75rem 1rem' }}>Product & Variant</th>
                   <th style={{ padding: '0.75rem 1rem' }}>Units Sold</th>
                   <th style={{ padding: '0.75rem 1rem' }}>Generated Revenue</th>
                 </tr>
               </thead>
               <tbody>
                 {productData.slice(0, 15).map((d, i) => (
                   <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                     <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{d.name}</td>
                     <td style={{ padding: '1rem', color: 'var(--accent-color)' }}>{d.qty}</td>
                     <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>₹{d.revenue.toLocaleString('en-IN')}</td>
                   </tr>
                 ))}
                 {productData.length === 0 && (
                   <tr><td colSpan="3" style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No sales logged yet.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* SUPPLIER EXPENDITURE REPORT */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', width: '100%' }}>
           <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Vendor Expenditure (Materials)</h3>
             <button onClick={exportSuppliers} style={{ background: '#21262d', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>CSV 📥</button>
           </div>
           <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                 <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                   <th style={{ padding: '0.75rem 1rem' }}>Supplier Source</th>
                   <th style={{ padding: '0.75rem 1rem' }}>Total Cost Paid</th>
                 </tr>
               </thead>
               <tbody>
                 {dealerData.slice(0, 15).map((d, i) => (
                   <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                     <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{d.name}</td>
                     <td style={{ padding: '1rem', color: 'var(--danger)', fontWeight: 'bold' }}>₹{d.amount.toLocaleString('en-IN')}</td>
                   </tr>
                 ))}
                 {dealerData.length === 0 && (
                   <tr><td colSpan="2" style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No material purchases logged yet.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>

    </div>
  );
};
export default Reports;
