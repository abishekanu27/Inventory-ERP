import React, { useState, useEffect } from 'react';
import { Truck, Plus, X } from 'lucide-react';
import { fetchSuppliers, createSupplier, createSupplierPayment } from '../api';
import { IndianRupee } from 'lucide-react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // Form State (New Supplier)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Form State (Payment)
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    await createSupplier({ name, phone, address });
    setShowModal(false);
    setName(''); setPhone(''); setAddress('');
    loadData();
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier || !paymentAmount) return;
    
    const result = await createSupplierPayment({
      supplier_id: selectedSupplier.id,
      amount: Number(paymentAmount),
      note: paymentNote
    });

    if (result) {
      alert(`Payment of ₹${paymentAmount} recorded for ${selectedSupplier.name}`);
      setShowPaymentModal(false);
      setPaymentAmount(''); setPaymentNote('');
      loadData();
    }
  };

  return (
    <div className="page fade-in" style={{ position: 'relative' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Vendor & Ledger</h1>
          <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Control material debt and provider financial protocols.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)} style={{
          backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', 
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600'
        }}>
          <Plus size={20} /> Register Supplier
        </button>
      </header>

      {/* NEW SUPPLIER MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '450px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>New Supplier Profile</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Business Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contact Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Operations Address</label>
                <textarea rows="3" value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)', resize: 'vertical'}} />
              </div>
              <button type="submit" style={{ marginTop: '0.5rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save Registration</button>
            </form>
          </div>
        </div>
      )}

      {/* MAKE PAYMENT MODAL */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '450px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ color: 'var(--success)' }}>Register Payment</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Paying toward balance of <strong>{selectedSupplier?.name}</strong></p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(47, 129, 247, 0.05)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Current Outstanding Debt:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--danger)' }}>₹{selectedSupplier?.balance?.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Amount to Pay (₹)</label>
                <input required type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--success)', fontSize: '1.1rem'}} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Payment Note (Optional)</label>
                <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="e.g. Bank Transfer Ref: 12345" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
              </div>
              <button type="submit" style={{ marginTop: '0.5rem', backgroundColor: 'var(--success)', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <IndianRupee size={18}/> Push Ledger Payment
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading ledger data...</p>
        ) : suppliers.length === 0 ? (
          <div className="flex-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(47, 129, 247, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-color)' }}><Truck size={48} /></div>
            <h2 style={{ marginBottom: '0.5rem' }}>No Suppliers Registered</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Start building your procurement network securely.</p>
          </div>
        ) : (
          <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Vendor / ID</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Contact Protocol</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Total Purchased (₹)</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Total Paid (₹)</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Balance Owed (₹)</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Ledger Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id || s._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>VND-{(s.id || 0).toString().padStart(4, '0')}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {s.phone ? <span>{s.phone}</span> : <span style={{color: 'var(--text-secondary)'}}>No phone</span>}
                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem'}}>{s.address || 'Locality unmapped'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{s.total_purchased?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '1rem', color: 'var(--success)' }}>{s.total_paid?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: s.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    ₹{s.balance?.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => { setSelectedSupplier(s); setShowPaymentModal(true); }}
                      style={{ padding: '0.5rem 1rem', background: 'rgba(35, 134, 54, 0.1)', color: '#3fb950', border: '1px solid #3fb950', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                    >
                      Make Payment
                    </button>
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

export default Suppliers;
