import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, ShoppingCart, Trash2, CheckCircle, Store } from 'lucide-react';
import { fetchProducts, fetchSuppliers, fetchPurchases, createPurchase } from '../api';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // App States
  const [isCreating, setIsCreating] = useState(false);

  // Cart States
  const [cart, setCart] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Active Item Selection States
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [qty, setQty] = useState(1);
  const [costPrice, setCostPrice] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [purData, prodData, supData] = await Promise.all([fetchPurchases(), fetchProducts(), fetchSuppliers()]);
    setPurchases(purData);
    setProducts(prodData);
    setSuppliers(supData);
    setLoading(false);
  };

  const totalCost = cart.reduce((acc, item) => acc + (item.cost_price * item.qty), 0);

  // Auto-fill amount paid as full amount by default for convenience
  useEffect(() => {
    if (totalCost > 0) setAmountPaid(totalCost);
  }, [totalCost]);

  const activeProduct = products.find(p => p.id === parseInt(selectedProductId));
  const activeVariant = activeProduct?.variants?.find(v => v.id === selectedVariantId);

  // Set default cost if unselected
  useEffect(() => {
     if (activeProduct && costPrice === 0) setCostPrice(activeProduct.price);
  }, [selectedProductId, activeProduct]);

  const handleAddToCart = () => {
    if (!activeProduct || !activeVariant) return alert('Select product and variant');
    if (qty <= 0) return alert('Quantity must be at least 1');
    if (costPrice <= 0) return alert('Cost price must be set directly per item unit.');

    const existingItem = cart.find(i => i.variantId === activeVariant.id);
    if (existingItem) {
      setCart(cart.map(i => i.variantId === activeVariant.id ? { ...i, qty: i.qty + parseInt(qty) } : i));
    } else {
      setCart([...cart, {
        productId: activeProduct.id,
        variantId: activeVariant.id,
        name: activeProduct.name,
        size: activeVariant.size,
        color: activeVariant.color,
        cost_price: Number(costPrice),
        qty: parseInt(qty)
      }]);
    }
    
    // reset selection
    setSelectedVariantId('');
    setQty(1);
    setCostPrice(0);
  };

  const handleRemoveFromCart = (vId) => {
    setCart(cart.filter(i => i.variantId !== vId));
  };

  const handleCompletePurchase = async () => {
    if (cart.length === 0) return alert("Procurement Cart is empty!");
    if (!selectedSupplierId) return alert("Select a registered vendor/supplier to attach this purchase limit to!");
    
    const targetSupplier = suppliers.find(s => s.id === parseInt(selectedSupplierId));

    const payload = {
      supplier_id: targetSupplier.id,
      supplier_name: targetSupplier.name,
      items: cart,
      total_cost: totalCost,
      amount_paid: Number(amountPaid)
    };

    const result = await createPurchase(payload);
    if (result) {
      alert("Purchase Logged! Global Inventory Stock Automatically Pushed.");
      setIsCreating(false);
      setCart([]); setSelectedSupplierId(''); setAmountPaid(0);
      loadData(); // Pull fresh
    } else {
      alert("Failed to commit purchase.");
    }
  };

  // --- RENDERING ---

  if (isCreating) {
    return (
      <div className="page fade-in">
        <header className="page-header responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Procure Stock</h1>
            <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Record manufacturer purchases to dynamically compound your physical stocks.</p>
          </div>
          <button className="primary-btn" onClick={() => setIsCreating(false)} style={{ backgroundColor: '#21262d', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Back to History</button>
        </header>

        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
          
          {/* LEFT: Item Selection & Cart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingCart size={18}/> Inward Buffer</h3>
              
              <div className="responsive-flex" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-end', borderBottom: '1px dashed var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product Frame</label>
                  <select value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); setSelectedVariantId(''); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#0d1117', color: 'white', border: '1px solid var(--border-color)'}}>
                    <option value="">-- Choose --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Specific Variant Configuration</label>
                  <select value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)} disabled={!selectedProductId} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#0d1117', color: 'white', border: '1px solid var(--border-color)'}}>
                    <option value="">-- Choose Target Variant --</option>
                    {activeProduct?.variants?.map(v => (
                      <option key={v.id} value={v.id}>{v.size} - {v.color} (Current: {v.stock})</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Unit Cost</label>
                  <input type="number" min="0" value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#0d1117', color: 'white', border: '1px solid var(--border-color)'}} />
                </div>

                <div style={{ flex: 0.8 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Qty (+)</label>
                  <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#0d1117', color: 'white', border: '1px solid var(--border-color)'}} />
                </div>

                <button onClick={handleAddToCart} style={{ padding: '0.75rem 1.5rem', background: '#2f81f7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Register Input</button>
              </div>

              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No items mapped into procurement queue.</p>
              ) : (
                <div className="table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.5rem 0' }}>Variant SKU Mapping</th>
                        <th style={{ padding: '0.5rem 0' }}>Unit Cost</th>
                        <th style={{ padding: '0.5rem 0', color: 'var(--success)' }}>Stock Increase</th>
                        <th style={{ padding: '0.5rem 0' }}>Expected Expense</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{item.name} <br/><span style={{fontWeight: 'normal', color: 'var(--text-secondary)', fontSize: '0.85rem'}}>{item.size} / {item.color}</span></td>
                          <td style={{ padding: '1rem 0' }}>₹{item.cost_price}</td>
                          <td style={{ padding: '1rem 0', color: 'var(--success)', fontWeight: 'bold' }}>+{item.qty} units</td>
                          <td style={{ padding: '1rem 0' }}>₹{(item.cost_price * item.qty).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                            <button onClick={() => handleRemoveFromCart(item.variantId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Logistics Detail Panel */}
          <div className="card" style={{ height: 'fit-content', backgroundColor: '#11151a' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Invoice Finalization</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}><Store size={16}/> Provider Source</label>
              <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}}>
                <option value="">-- Attach Supplier Record --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {suppliers.length === 0 && <span style={{fontSize: '0.8rem', color: '#f6c343', marginTop: '0.5rem', display: 'block'}}>Warning: Suppliers dictionary is empty.</span>}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Material Subtotal</span>
                <span>₹{totalCost.toLocaleString('en-IN')}</span>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount Paid Today (₹)</label>
                <input 
                  type="number" 
                  value={amountPaid} 
                  onChange={e => setAmountPaid(Number(e.target.value))} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--accent-color)'}} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                <span style={{ fontSize: '1.1rem' }}>Remaining Balance</span>
                <span style={{ color: 'var(--danger)' }}>₹{(totalCost - amountPaid).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button onClick={handleCompletePurchase} style={{ width: '100%', padding: '1rem', marginTop: '2rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={20}/> Finalize Supply & Mount Stock
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- DEFAULT LIST VIEW ---
  return (
    <div className="page fade-in">
      <header className="page-header responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Procurement Ledger</h1>
          <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Logs of inbound stock compounding operations.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="primary-btn" style={{
          backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', 
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600'
        }}>
          <Plus size={20} /> Register Inbound Container
        </button>
      </header>

      <div className="card">
        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading ledger...</p>
        ) : purchases.length === 0 ? (
          <div className="flex-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(47, 129, 247, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-color)' }}><ShoppingBag size={48} /></div>
            <h2 style={{ marginBottom: '0.5rem' }}>No Imports Recorded</h2>
            <p style={{ color: 'var(--text-secondary)' }}>You haven't explicitly boosted inventory through a Supplier log.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Supply Job ID</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Vendor / Supplier</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date Executed</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Total Cost (₹)</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Paid (₹)</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((pur) => (
                  <tr key={pur.id || pur._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>IMP-{(pur.id || 0).toString().padStart(4, '0')}</td>
                    <td style={{ padding: '1rem' }}>{pur.supplier_name}</td>
                    <td style={{ padding: '1rem' }}>{new Date(pur.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>₹{pur.total_cost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '1rem', color: 'var(--success)' }}>₹{(pur.amount_paid || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: (pur.total_cost - (pur.amount_paid || 0)) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{(pur.total_cost - (pur.amount_paid || 0)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchases;
