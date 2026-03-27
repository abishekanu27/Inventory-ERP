// detect if we are on the dev server (5173) or production (5000 / live url)
const isDev = window.location.port === '5173';
const API_BASE_URL = isDev ? `http://${window.location.hostname}:5000/api` : '/api';

export const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Failed to create product');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Failed to update product');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete product');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateStock = async (productId, variantId, qtyChange) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/variant/${variantId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qtyChange }),
    });
    if (!response.ok) throw new Error('Failed to update stock');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchInvoices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices`);
    if (!response.ok) throw new Error('Failed to fetch invoices');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const createInvoice = async (invoiceData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error('Failed to create invoice');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchCustomers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers`);
    if (!response.ok) throw new Error('Failed to fetch customers');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchSuppliers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    if (!response.ok) throw new Error('Failed to fetch suppliers');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const createSupplier = async (supplierData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData),
    });
    if (!response.ok) throw new Error('Failed to create supplier');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchPurchases = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/purchases`);
    if (!response.ok) throw new Error('Failed to fetch purchases');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const createPurchase = async (purchaseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData),
    });
    if (!response.ok) throw new Error('Failed to create purchase');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const createSupplierPayment = async (paymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/suppliers/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) throw new Error('Failed to create payment');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
