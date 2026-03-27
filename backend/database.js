const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'erp.json');

// Initialize DB file structured natively for Variants tracking
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
        products: [
            { 
                id: 1, 
                name: "Premium Cotton Shirt", 
                category: "Menswear", 
                price: 1200,
                variants: [
                    { id: "v1-1", size: "M", color: "White", stock: 25 },
                    { id: "v1-2", size: "L", color: "Blue", stock: 20 }
                ]
            },
            { 
                id: 2, 
                name: "Silk Saree", 
                category: "Womenswear", 
                price: 4500,
                variants: [
                    { id: "v2-1", size: "Free", color: "Red", stock: 5 },
                    { id: "v2-2", size: "Free", color: "Green", stock: 3 }
                ]
            }
        ],
        invoices: []
    }, null, 2));
}

const getDb = () => {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    let modified = false;
    if (!data.customers) { data.customers = []; modified = true; }
    if (!data.suppliers) { data.suppliers = []; modified = true; }
    if (!data.purchases) { data.purchases = []; modified = true; }
    if (!data.supplier_payments) { data.supplier_payments = []; modified = true; }
    if (modified) saveDb(data);
    return data;
};
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

const db = {
    all: (sql, params, callback) => {
        try {
            const data = getDb();
            if (sql.includes('products')) {
                callback(null, data.products);
            } else if (sql.includes('invoices')) {
                callback(null, data.invoices);
            } else if (sql.includes('customers')) {
                callback(null, data.customers);
            } else if (sql.includes('suppliers')) {
                callback(null, data.suppliers);
            } else if (sql.includes('purchases')) {
                callback(null, data.purchases);
            } else {
                callback(new Error("Table not found"), null);
            }
        } catch (err) {
            callback(err, null);
        }
    },
    run: function(sql, params, callback) {
        try {
            const data = getDb();
            
            // Insert Product
            if (sql.includes('INSERT INTO products')) {
                const id = data.products.length ? Math.max(...data.products.map(p => p.id)) + 1 : 1;
                // params: [name, category, price, variantsJSON]
                const variants = JSON.parse(params[3] || '[]');
                
                // create IDs for variants
                variants.forEach((v, index) => {
                    v.id = `v${id}-${index + 1}`;
                });
                
                data.products.push({ id, name: params[0], category: params[1], price: params[2], variants });
                saveDb(data);
                this.lastID = id;
            } 
            // Insert Invoice
            else if (sql.includes('INSERT INTO invoices')) {
                const id = data.invoices.length ? Math.max(...data.invoices.map(p => p.id)) + 1 : 1;
                const created_at = new Date().toISOString();
                data.invoices.push({ id, customer_name: params[0], total_amount: params[1], created_at });
                saveDb(data);
                this.lastID = id;
            }
            callback.call(this, null);
        } catch (err) {
            callback(err);
        }
    },
    updateStock: (productId, variantId, qtyChange, callback) => {
        try {
            const data = getDb();
            const product = data.products.find(p => p.id === parseInt(productId));
            if (!product) return callback(new Error("Product not found"));
            
            const variant = product.variants.find(v => v.id === variantId);
            if (!variant) return callback(new Error("Variant not found"));
            
            variant.stock += qtyChange;
            if (variant.stock < 0) variant.stock = 0; // Prevent negative physical bounds theoretically
            
            saveDb(data);
            callback(null, variant.stock);
        } catch (err) {
            callback(err);
        }
    },
    updateProduct: (id, payload, callback) => {
        try {
            const data = getDb();
            const index = data.products.findIndex(p => p.id === parseInt(id));
            if (index === -1) return callback(new Error("Product not found"));
            // Preserve variants unless overwritten, but we will overwrite fully
            const variants = payload.variants ? payload.variants.map((v, i) => {
                if (!v.id) v.id = `v${id}-${Date.now()}-${i}`;
                return v;
            }) : data.products[index].variants;
            
            data.products[index] = { ...data.products[index], ...payload, variants };
            saveDb(data);
            callback(null);
        } catch (err) {
            callback(err);
        }
    },
    deleteProduct: (id, callback) => {
        try {
            const data = getDb();
            const initialLength = data.products.length;
            data.products = data.products.filter(p => p.id !== parseInt(id));
            if (data.products.length === initialLength) return callback(new Error("Product not found"));
            saveDb(data);
            callback(null);
        } catch (err) {
            callback(err);
        }
    },
    createInvoice: (payload, callback) => {
        try {
            const data = getDb();
            
            // Verify stock first to ensure atomic transaction constraints
            for (let item of payload.items) {
                const product = data.products.find(p => p.id === parseInt(item.productId));
                if (!product) throw new Error(`Product mapping failed for ${item.name}`);
                
                const variant = product.variants.find(v => v.id === item.variantId);
                if (!variant) throw new Error(`Variant structure compromised for ${item.name}`);
                
                if (variant.stock < item.qty) {
                    throw new Error(`Insufficient physical stock for ${item.name} (${item.size}/${item.color}). Requesting ${item.qty}, Available: ${variant.stock}.`);
                }
            }

            // Execute stock deduction post-verification safely
            for (let item of payload.items) {
                const product = data.products.find(p => p.id === parseInt(item.productId));
                const variant = product.variants.find(v => v.id === item.variantId);
                variant.stock -= item.qty;
            }

            // Construct invoice container natively
            const id = data.invoices.length ? Math.max(...data.invoices.map(p => p.id)) + 1 : 1;
            const newInvoice = {
                id,
                customer_name: payload.customer_name || 'Online Customer',
                customer_phone: payload.customer_phone || '',
                customer_address: payload.customer_address || '',
                items: payload.items,
                subtotal: payload.subtotal,
                discount_pct: payload.discount_pct || 0,
                discount: payload.discount || 0,
                total_amount: payload.total,
                payment_mode: payload.payment_mode || 'COD',
                created_at: new Date().toISOString()
            };

            data.invoices.unshift(newInvoice); // Place new invoices top-of-stack natively
            
            // CRM: Auto-Track Customer Profile
            if (newInvoice.customer_phone) {
                let customer = data.customers.find(c => c.phone === newInvoice.customer_phone);
                if (customer) {
                    customer.total_spent += newInvoice.total_amount;
                    customer.total_orders += 1;
                    // update latest known address
                    customer.address = newInvoice.customer_address || customer.address;
                    customer.name = newInvoice.customer_name || customer.name;
                } else {
                    const cid = data.customers.length ? Math.max(...data.customers.map(c => c.id)) + 1 : 1;
                    data.customers.unshift({
                        id: cid,
                        name: newInvoice.customer_name,
                        phone: newInvoice.customer_phone,
                        address: newInvoice.customer_address,
                        total_spent: newInvoice.total_amount,
                        total_orders: 1,
                        created_at: new Date().toISOString()
                    });
                }
            }

            saveDb(data);
            
            callback(null, newInvoice);
        } catch (err) {
            callback(err);
        }
    },
    createSupplier: (payload, callback) => {
        try {
            const data = getDb();
            const id = data.suppliers.length ? Math.max(...data.suppliers.map(s => s.id)) + 1 : 1;
            const newSupplier = {
                id,
                name: payload.name,
                phone: payload.phone || '',
                address: payload.address || '',
                created_at: new Date().toISOString()
            };
            data.suppliers.unshift(newSupplier);
            saveDb(data);
            callback(null, newSupplier);
        } catch (err) {
            callback(err);
        }
    },
    createPurchase: (payload, callback) => {
        try {
            const data = getDb();
            
            // Validate incoming items
            for (let item of payload.items) {
                const product = data.products.find(p => p.id === parseInt(item.productId));
                if (!product) throw new Error(`Product mapping failed for ${item.name}`);
                const variant = product.variants.find(v => v.id === item.variantId);
                if (!variant) throw new Error(`Variant mapping failed for ${item.name}`);
            }

            // Compound Inventory Stock POSITIVELY
            for (let item of payload.items) {
                const product = data.products.find(p => p.id === parseInt(item.productId));
                const variant = product.variants.find(v => v.id === item.variantId);
                variant.stock += item.qty;
            }

            const id = data.purchases.length ? Math.max(...data.purchases.map(p => p.id)) + 1 : 1;
            const newPurchase = {
                id,
                supplier_id: payload.supplier_id,
                supplier_name: payload.supplier_name,
                items: payload.items, // { productId, variantId, qty, cost_price, name, size, color }
                total_cost: payload.total_cost,
                amount_paid: payload.amount_paid || 0,
                date: new Date().toISOString()
            };

            data.purchases.unshift(newPurchase);
            saveDb(data);
            
            callback(null, newPurchase);
        } catch (err) {
            callback(err);
        }
    },
    createSupplierPayment: (payload, callback) => {
        try {
            const data = getDb();
            const id = data.supplier_payments.length ? Math.max(...data.supplier_payments.map(p => p.id)) + 1 : 1;
            const newPayment = {
                id,
                supplier_id: payload.supplier_id,
                amount: payload.amount,
                note: payload.note || 'Ledger Payment',
                date: new Date().toISOString()
            };
            data.supplier_payments.unshift(newPayment);
            saveDb(data);
            callback(null, newPayment);
        } catch (err) {
            callback(err);
        }
    }
};

module.exports = db;
