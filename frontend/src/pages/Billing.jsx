import React, { useState, useEffect } from 'react';
import { FileText, Plus, ShoppingCart, Trash2, Printer, CheckCircle, Smartphone, MapPin, User, Tag, MessageCircle, Package } from 'lucide-react';
import { fetchInvoices, fetchProducts, createInvoice } from '../api';
import html2pdf from 'html2pdf.js';

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // App States
  const [isCreating, setIsCreating] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Cart States
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Active Item Selection States
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [invData, prodData] = await Promise.all([fetchInvoices(), fetchProducts()]);
    setInvoices(invData);
    setProducts(prodData);
    setLoading(false);
  };

  // Derived calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountAmount = subtotal * (discountPct / 100);
  const total = Math.max(0, subtotal - discountAmount);

  const activeProduct = products.find(p => p.id === parseInt(selectedProductId));
  const activeVariant = activeProduct?.variants?.find(v => v.id === selectedVariantId);

  const handleAddToCart = () => {
    if (!activeProduct || !activeVariant) return alert('Select product and variant');
    if (qty <= 0) return alert('Quantity must be at least 1');
    if (qty > activeVariant.stock) return alert(`Not enough stock! Only ${activeVariant.stock} available.`);

    const existingItem = cart.find(i => i.variantId === activeVariant.id);
    if (existingItem) {
      if (existingItem.qty + qty > activeVariant.stock) {
         return alert(`Cannot add more. Limit reached. (${activeVariant.stock})`);
      }
      setCart(cart.map(i => i.variantId === activeVariant.id ? { ...i, qty: i.qty + parseInt(qty) } : i));
    } else {
      setCart([...cart, {
        productId: activeProduct.id,
        variantId: activeVariant.id,
        name: activeProduct.name,
        size: activeVariant.size,
        color: activeVariant.color,
        price: activeProduct.price,
        qty: parseInt(qty)
      }]);
    }
    
    // reset selection
    setSelectedVariantId('');
    setQty(1);
  };

  const handleRemoveFromCart = (vId) => {
    setCart(cart.filter(i => i.variantId !== vId));
  };

  const handlePrintInvoice = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!customerName) return alert("Customer Name is required for online shipping!");
    if (!customerPhone) return alert("Phone Number is required for online shipping!");
    if (!customerAddress) return alert("Delivery Address is required!");
    
    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      items: cart,
      subtotal,
      discount_pct: discountPct,
      discount: discountAmount,
      total,
      payment_mode: paymentMode
    };

    const result = await createInvoice(payload);
    if (result) {
      // Show Receipt layer
      setReceipt(result);
      setIsCreating(false);
      // Reset form
      setCart([]); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setDiscountPct(0); setPaymentMode('UPI');
      loadData(); // refresh stocks and invoices natively
    } else {
      alert("Failed to create invoice. Server check failed.");
    }
  };

  const handleWhatsAppShare = async () => {
    if (!receipt || !receipt.customer_phone) return alert("No valid phone number linked to this invoice.");
    const purePhone = receipt.customer_phone.replace(/\D/g,'');
    const waPhone = purePhone.length === 10 ? `91${purePhone}` : purePhone; 
    const waText = `Hello ${receipt.customer_name},\n\nYour invoice *INV-${(receipt.id || 0).toString().padStart(4, '0')}* is confirmed!\nTotal Amount: *₹${receipt.total_amount.toLocaleString('en-IN')}*\n\nThank you for choosing us! 👕`;
    
    // Generate physical PDF blob for strictly the Invoice
    const element = document.getElementById('invoice-capture');
    const opt = {
      margin:       0.5,
      filename:     `INV-${(receipt.id || 0).toString().padStart(4, '0')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

      // Natively handoff to mobile Share sheet directly containing the file pointer
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Invoice Document',
          text: waText,
          files: [file]
        });
      } else {
        // Fallback for Desktop Browsers mapping auto-downloads
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = opt.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("The PDF has been generated and saved to your device. Opening WhatsApp. You can now drag and drop the attachment!");
        window.open(`https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waText)}`, '_blank');
      }
    } catch (err) {
      console.error(err);
      alert("Failed compiling PDF attachment.");
    }
  };

  const handleDownloadShipping = async () => {
    const element = document.getElementById('shipping-capture');
    const opt = {
      margin:       0.5,
      filename:     `SHIP-${(receipt.id || 0).toString().padStart(4, '0')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    try {
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = opt.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed compiling Shipping Label.");
    }
  };

  // --- RENDERING ---

  if (receipt) {
    return (
      <div className="page fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }} className="no-print">
          <button onClick={() => window.print()} style={{ padding: '0.75rem 1.5rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}><Printer/> Print Receipt</button>
          <button onClick={handleWhatsAppShare} style={{ padding: '0.75rem 1.5rem', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}><MessageCircle/> Share via WhatsApp</button>
          <button onClick={handleDownloadShipping} style={{ padding: '0.75rem 1.5rem', background: '#2f81f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}><Package/> Download Shipping Label</button>
          <button onClick={() => setReceipt(null)} style={{ padding: '0.75rem 1.5rem', background: '#21262d', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>Close & Return</button>
        </div>

        <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          
          {/* INVOICE CAPTURE BLOCK */}
          <div id="invoice-capture" style={{ width: '100%' }}>
          {/* receipt container specifically formatted for printing */}
          <div className="receipt-paper" style={{ background: 'white', color: 'black', padding: '2rem', width: '100%', border: '1px solid #ddd', fontFamily: 'monospace' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: '#161b22', padding: '0.75rem 1.5rem', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }} className="invoice-brand">
                <img src="/logo.png" style={{ height: '40px', objectFit: 'contain' }} alt="Velmora" />
                <h2 style={{ margin: 0, marginLeft: '12px', color: 'white', letterSpacing: '1px' }}>Velmora</h2>
              </div>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>TAX INVOICE</p>
            </div>
            
            <div style={{ marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p><strong>Receipt:</strong> INV-{(receipt.id || 0).toString().padStart(4, '0')}</p>
                <p><strong>Date:</strong> {new Date(receipt.created_at).toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p><strong>Mode:</strong> {receipt.payment_mode === 'UPI' ? 'UPI (Paid)' : receipt.payment_mode}</p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', border: '1px solid #eee', fontSize: '0.9rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Billed To:</h4>
              <p style={{ margin: '0.2rem 0', textTransform: 'uppercase' }}><strong>{receipt.customer_name}</strong></p>
              <p style={{ margin: '0.2rem 0' }}>Phone: {receipt.customer_phone || 'N/A'}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px dashed #eee' }}>
                    <td style={{ padding: '0.5rem 0' }}>{it.name}<br/><small>{it.size} | {it.color}</small></td>
                    <td style={{ textAlign: 'center', padding: '0.5rem 0' }}>{it.qty}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>{(it.qty * it.price).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
              <p>Subtotal: ₹{receipt.subtotal.toLocaleString('en-IN')}</p>
              {receipt.discount_pct > 0 && <p>Discount ({receipt.discount_pct}%): -₹{receipt.discount.toLocaleString('en-IN')}</p>}
              <h3 style={{ margin: '0.5rem 0', borderTop: '1px dashed #ccc', paddingTop: '0.5rem' }}>Total: ₹{receipt.total_amount.toLocaleString('en-IN')}</h3>
            </div>
          </div>
          </div>

          {/* SHIPPING CAPTURE BLOCK */}
          <div id="shipping-capture" style={{ width: '100%' }} className="no-print">
            {/* Dedicated Shipping Label (Prints on new page) */}
            <div className="receipt-paper page-break" style={{ background: 'white', color: 'black', padding: '2rem', width: '100%', border: '1px solid #ddd', fontFamily: 'monospace' }}>
               <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '2px' }}>SHIPPING LABEL</h2>
                  <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>INV-{(receipt.id || 0).toString().padStart(4, '0')}</p>
               </div>
               
               <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>SENDER:</h3>
                  <p style={{ margin: '0.2rem 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Velmora ERP</p>
                  <p style={{ margin: '0.2rem 0' }}>HQ Fulfillment Center</p>
               </div>

               <div style={{ padding: '1.5rem', border: '2px dashed #000', backgroundColor: '#fafafa' }}>
                  <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>DELIVER TO:</h3>
                  <h2 style={{ margin: '0.5rem 0', fontSize: '1.6rem', textTransform: 'uppercase' }}>{receipt.customer_name}</h2>
                  <p style={{ margin: '0.5rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>📞 {receipt.customer_phone || 'Phone: N/A'}</p>
                  <p style={{ margin: '1rem 0 0 0', fontSize: '1.1rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                     {receipt.customer_address || 'Address not provided'}
                  </p>
               </div>
               
               {receipt.payment_mode === 'COD' && (
                 <div style={{ marginTop: '2rem', padding: '1rem', border: '3px solid black', textAlign: 'center' }}>
                   <h1 style={{ margin: 0 }}>C.O.D.</h1>
                   <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Collect: ₹{receipt.total_amount.toLocaleString('en-IN')}</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="page fade-in">
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Generate Invoice</h1>
            <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Create an order packing bill for online dispatch.</p>
          </div>
          <button className="primary-btn" onClick={() => setIsCreating(false)} style={{
            backgroundColor: '#21262d', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer'
          }}>Back to Invoices</button>
        </header>

        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
          
          {/* LEFT: Item Selection & Cart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingCart size={18}/> Cart Items</h3>
              
              <div className="responsive-flex" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-end', borderBottom: '1px dashed var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Product</label>
                  <select value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); setSelectedVariantId(''); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#0d1117', color: 'white', border: '1px solid var(--border-color)'}}>
                    <option value="">-- Choose --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                  </select>
                </div>
                
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Variant</label>
                  <select value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)} disabled={!selectedProductId} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#0d1117', color: 'white', border: '1px solid var(--border-color)'}}>
                    <option value="">-- Choose --</option>
                    {activeProduct?.variants?.map(v => (
                      <option key={v.id} value={v.id} disabled={v.stock === 0}>{v.size} - {v.color} ({v.stock} left)</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Qty</label>
                  <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#0d1117', color: 'white', border: '1px solid var(--border-color)'}} />
                </div>

                <button onClick={handleAddToCart} style={{ padding: '0.75rem 1.5rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Add</button>
              </div>

              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No items added yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem 0' }}>Item</th>
                      <th style={{ padding: '0.5rem 0' }}>Price</th>
                      <th style={{ padding: '0.5rem 0' }}>Qty</th>
                      <th style={{ padding: '0.5rem 0' }}>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{item.name} <br/><span style={{fontWeight: 'normal', color: 'var(--text-secondary)', fontSize: '0.85rem'}}>{item.size} / {item.color}</span></td>
                        <td style={{ padding: '1rem 0' }}>₹{item.price}</td>
                        <td style={{ padding: '1rem 0' }}>{item.qty}</td>
                        <td style={{ padding: '1rem 0', color: 'var(--accent-hover)' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                          <button onClick={() => handleRemoveFromCart(item.variantId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT: Customer & Logistics Detail Panel */}
          <div className="card" style={{ height: 'fit-content', backgroundColor: '#11151a' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Shipping Details</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}><User size={16}/> Customer Name</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="E.g., John Doe" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}><Smartphone size={16}/> Phone Number</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="E.g., +91 9876543210" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}><MapPin size={16}/> Delivery Address</label>
              <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Enter full shipping address..." rows={3} style={{ width: '100%', padding: '0.75rem', resize: 'vertical', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}}>
                <option value="UPI">UPI</option>
                <option value="COD">Cash on Delivery (COD)</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Tag size={16}/> Discount (%)</span>
                <input type="number" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} style={{ width: '80px', padding: '0.25rem', textAlign: 'right', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
              </div>
              {discountPct > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--success)', fontSize: '0.85rem' }}>
                 Saving: ₹{discountAmount.toLocaleString('en-IN')}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent-hover)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button onClick={handlePrintInvoice} style={{ width: '100%', padding: '1rem', marginTop: '2rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(47, 129, 247, 0.4)' }}>
              <Printer size={20}/> Print Invoice
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- DEFAULT INVOICE LIST VIEW ---
  return (
    <div className="page fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Dispatches / Invoices</h1>
          <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Generate and track bills for online fulfillment.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="primary-btn" style={{
          backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', 
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600'
        }}>
          <Plus size={20} /> Create New Bill
        </button>
      </header>

      <div className="card">
        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <div className="flex-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(47, 129, 247, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-color)' }}><FileText size={48} /></div>
            <h2 style={{ marginBottom: '0.5rem' }}>No bills generated yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Create a packing slip to deduct stock and process a sale.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Invoice ID</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Customer Details</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Mode</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Total Amount (₹)</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id || invoice._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>INV-{(invoice.id || 0).toString().padStart(4, '0')}</td>
                  <td style={{ padding: '1rem' }}>{invoice.customer_name}<br/><span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{invoice.customer_phone}</span></td>
                  <td style={{ padding: '1rem' }}>{new Date(invoice.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>{invoice.payment_mode}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-hover)' }}>₹{invoice.total_amount.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                     <button onClick={() => setReceipt(invoice)} style={{ padding: '0.4rem 0.8rem', background: '#21262d', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>View Receipt</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Billing;
