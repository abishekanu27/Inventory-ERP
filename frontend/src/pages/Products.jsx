import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, AlertTriangle, ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { fetchProducts, createProduct, updateStock, updateProduct, deleteProduct } from '../api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [editId, setEditId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Menswear');
  const [price, setPrice] = useState(0);
  const [variants, setVariants] = useState([{ size: 'M', color: 'White', stock: 10 }]);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddVariant = () => {
    setVariants([...variants, { size: 'L', color: 'Black', stock: 10 }]);
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await updateProduct(editId, { name, category, price, variants });
    } else {
      await createProduct({ name, category, price, variants });
    }
    setShowModal(false);
    // Reset
    setEditId(null); setName(''); setPrice(0); setVariants([{ size: 'M', color: 'White', stock: 10 }]);
    loadProducts();
  };

  const openAddModal = () => {
    setEditId(null);
    setName(''); setCategory('Menswear'); setPrice(0); setVariants([{ size: 'M', color: 'White', stock: 10 }]);
    setShowModal(true);
  };

  const handleEditProduct = (e, p) => {
    e.stopPropagation();
    setEditId(p.id);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price);
    // Deep copy variants so we don't accidentally mutate the state live before saving
    setVariants(JSON.parse(JSON.stringify(p.variants || [])));
    setShowModal(true);
  };

  const handleDeleteProduct = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this product and all its variants?')) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  const handleStockAdjust = async (pId, vId, change) => {
    await updateStock(pId, vId, change);
    loadProducts();
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="page fade-in" style={{ position: 'relative' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Manage your clothing stock & variants.</p>
        </div>
        <button className="primary-btn" onClick={openAddModal} style={{
          backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', 
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600'
        }}>
          <Plus size={20} /> Add Product
        </button>
      </header>

      {/* MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Product Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}}>
                    <option>Menswear</option>
                    <option>Womenswear</option>
                    <option>Kids</option>
                    <option>Accessories</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Price (₹)</label>
                  <input required type="number" value={price} onChange={e => setPrice(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)'}} />
                </div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3>Product Variants</h3>
                  <button type="button" onClick={handleAddVariant} style={{ background: '#238636', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>+ Add Size/Color</button>
                </div>
                {variants.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input placeholder="Size" value={v.size} onChange={e => handleVariantChange(i, 'size', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)', width: '30%'}} />
                    <input placeholder="Color" value={v.color} onChange={e => handleVariantChange(i, 'color', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)', width: '30%'}} />
                    <input type="number" placeholder="Qty" value={v.stock} onChange={e => handleVariantChange(i, 'stock', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid var(--border-color)', width: '30%'}} />
                    <button type="button" onClick={() => handleRemoveVariant(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={20} /></button>
                  </div>
                ))}
              </div>

              <button type="submit" style={{ marginTop: '1rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{editId ? 'Update Inventory' : 'Save Product'}</button>
            </form>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="card">
        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading inventory...</p>
        ) : products.length === 0 ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No products found. Start by adding some.</p>
        ) : (
          <>
            <br/>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', width: '40px' }}></th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Product Name</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Category</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Total Stock</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Price (₹)</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Total Value (₹)</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.variants ? product.variants.reduce((acc, v) => acc + v.stock, 0) : 0;
                  const lowStockCount = product.variants ? product.variants.filter(v => v.stock < 10).length : 0;
                  const totalValue = totalStock * product.price;

                  return (
                    <React.Fragment key={`p-${product.id}`}>
                      <tr onClick={() => toggleExpand(product.id)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: expanded[product.id] ? 'rgba(47, 129, 247, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '1rem' }}>
                          {expanded[product.id] ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{product.name}</td>
                        <td style={{ padding: '1rem' }}>{product.category}</td>
                        <td style={{ padding: '1rem' }}>{totalStock}</td>
                        <td style={{ padding: '1rem' }}>{product.price.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--accent-hover)' }}>{totalValue.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem' }}>
                          {lowStockCount > 0 ? (
                            <span style={{ color: '#f6c343', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={16}/> {lowStockCount} Variant(s) Low</span>
                          ) : (
                            <span style={{ color: 'var(--success)' }}>Optimal</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                           <button onClick={(e) => handleEditProduct(e, product)} style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }} title="Edit Product"><Edit size={16} /></button>
                           <button onClick={(e) => handleDeleteProduct(e, product.id)} style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }} title="Delete Product"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                      {expanded[product.id] && product.variants && (
                        <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                          <td colSpan={8} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ paddingLeft: '2rem' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '0.5rem' }}>SKU/ID</th>
                                    <th style={{ padding: '0.5rem' }}>Size</th>
                                    <th style={{ padding: '0.5rem' }}>Color</th>
                                    <th style={{ padding: '0.5rem' }}>StockQty</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Modify Stock (Purchases / Sales)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.variants.map((v) => (
                                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                      <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{v.id}</td>
                                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{v.size}</td>
                                      <td style={{ padding: '0.5rem' }}>
                                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: v.color.toLowerCase(), marginRight: '0.5rem', border: '1px solid #666' }}></span>
                                        {v.color}
                                      </td>
                                      <td style={{ padding: '0.5rem' }}>
                                        <span style={{ color: v.stock < 10 ? '#f6c343' : 'var(--text-primary)', fontWeight: 'bold' }}>{v.stock} units</span>
                                      </td>
                                      <td style={{ padding: '0.5rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleStockAdjust(product.id, v.id, -1)} style={{ background: '#da3633', border: 'none', color: 'white', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Record standard sale visually"><Minus size={16} /> Sales</button>
                                        <button onClick={() => handleStockAdjust(product.id, v.id, 1)} style={{ background: '#238636', border: 'none', color: 'white', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Receive vendor shipment"><Plus size={16} /> Purchase</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
