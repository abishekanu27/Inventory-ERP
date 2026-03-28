const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB Atlas
const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("CRITICAL: MONGO_URI is not defined in environment variables!");
} else {
    mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
    })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error details:', err.message));
}

// --- SCHEMAS ---
const ProductSchema = new mongoose.Schema({
    id: Number,
    name: String,
    category: String,
    price: Number,
    variants: [{
        id: String,
        size: String,
        color: String,
        stock: { type: Number, default: 0 }
    }]
});

const InvoiceSchema = new mongoose.Schema({
    id: Number,
    customer_name: String,
    customer_phone: String,
    customer_address: String,
    items: Array,
    subtotal: Number,
    discount_pct: Number,
    discount: Number,
    total_amount: Number,
    payment_mode: String,
    created_at: { type: Date, default: Date.now }
});

const CustomerSchema = new mongoose.Schema({
    id: Number,
    name: String,
    phone: String,
    address: String,
    total_spent: { type: Number, default: 0 },
    total_orders: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

const SupplierSchema = new mongoose.Schema({
    id: Number,
    name: String,
    phone: String,
    address: String,
    created_at: { type: Date, default: Date.now }
});

const PurchaseSchema = new mongoose.Schema({
    id: Number,
    supplier_id: Number,
    supplier_name: String,
    items: Array,
    total_cost: Number,
    amount_paid: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
});

const SupplierPaymentSchema = new mongoose.Schema({
    id: Number,
    supplier_id: Number,
    amount: Number,
    note: String,
    date: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);
const Invoice = mongoose.model('Invoice', InvoiceSchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Supplier = mongoose.model('Supplier', SupplierSchema);
const Purchase = mongoose.model('Purchase', PurchaseSchema);
const SupplierPayment = mongoose.model('SupplierPayment', SupplierPaymentSchema);

// --- DB INTERFACE (Legacy Wrapper for Controller Compatibility) ---
const db = {
    all: async (sql, params, callback) => {
        try {
            let data = [];
            if (sql.includes('FROM products')) data = await Product.find().sort({ id: -1 });
            else if (sql.includes('FROM invoices')) data = await Invoice.find().sort({ created_at: -1 });
            else if (sql.includes('FROM customers')) data = await Customer.find().sort({ id: -1 });
            else if (sql.includes('FROM supplier_payments')) data = await SupplierPayment.find().sort({ date: -1 });
            else if (sql.includes('FROM suppliers')) data = await Supplier.find().sort({ id: -1 });
            else if (sql.includes('FROM purchases')) data = await Purchase.find().sort({ date: -1 });
            
            callback(null, data);
        } catch (err) {
            callback(err, null);
        }
    },

    updateStock: async (productId, variantId, qtyChange, callback) => {
        try {
            const product = await Product.findOne({ id: productId });
            if (!product) return callback(new Error("Product not found"));
            
            const variant = product.variants.find(v => v.id === variantId);
            if (!variant) return callback(new Error("Variant not found"));
            
            variant.stock += qtyChange;
            if (variant.stock < 0) variant.stock = 0;
            
            await product.save();
            callback(null, variant.stock);
        } catch (err) {
            callback(err);
        }
    },

    updateProduct: async (id, payload, callback) => {
        try {
            const product = await Product.findOne({ id: parseInt(id) });
            if (!product) return callback(new Error("Product not found"));
            
            if (payload.variants) {
                payload.variants = payload.variants.map((v, i) => {
                    if (!v.id) v.id = `v${id}-${Date.now()}-${i}`;
                    return v;
                });
            }
            
            Object.assign(product, payload);
            await product.save();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    deleteProduct: async (id, callback) => {
        try {
            await Product.deleteOne({ id: parseInt(id) });
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    createInvoice: async (payload, callback) => {
        try {
            // Verify stock
            for (let item of payload.items) {
                const product = await Product.findOne({ id: parseInt(item.productId) });
                if (!product) throw new Error(`Product mapping failed for ${item.name}`);
                const variant = product.variants.find(v => v.id === item.variantId);
                if (variant.stock < item.qty) throw new Error(`Insufficient stock for ${item.name}`);
            }

            // Deduct stock
            for (let item of payload.items) {
                const product = await Product.findOne({ id: parseInt(item.productId) });
                const variant = product.variants.find(v => v.id === item.variantId);
                variant.stock -= item.qty;
                await product.save();
            }

            const lastInvoice = await Invoice.findOne().sort({ id: -1 });
            const id = lastInvoice ? lastInvoice.id + 1 : 1;

            const newInvoice = new Invoice({ ...payload, id, total_amount: payload.total });
            await newInvoice.save();

            // CRM Sync
            if (newInvoice.customer_phone) {
                let customer = await Customer.findOne({ phone: newInvoice.customer_phone });
                if (customer) {
                    customer.total_spent += newInvoice.total_amount;
                    customer.total_orders += 1;
                    customer.name = newInvoice.customer_name || customer.name;
                    await customer.save();
                } else {
                    const lastCust = await Customer.findOne().sort({ id: -1 });
                    const cid = lastCust ? lastCust.id + 1 : 1;
                    const newCust = new Customer({
                        id: cid,
                        name: newInvoice.customer_name,
                        phone: newInvoice.customer_phone,
                        address: newInvoice.customer_address,
                        total_spent: newInvoice.total_amount,
                        total_orders: 1
                    });
                    await newCust.save();
                }
            }

            callback(null, newInvoice);
        } catch (err) {
            callback(err);
        }
    },

    createSupplier: async (payload, callback) => {
        try {
            const lastSup = await Supplier.findOne().sort({ id: -1 });
            const id = lastSup ? lastSup.id + 1 : 1;
            const newSup = new Supplier({ ...payload, id });
            await newSup.save();
            callback(null, newSup);
        } catch (err) {
            callback(err);
        }
    },

    createPurchase: async (payload, callback) => {
        try {
            // Stock Compounding
            for (let item of payload.items) {
                const product = await Product.findOne({ id: parseInt(item.productId) });
                const variant = product.variants.find(v => v.id === item.variantId);
                variant.stock += item.qty;
                await product.save();
            }

            const lastPur = await Purchase.findOne().sort({ id: -1 });
            const id = lastPur ? lastPur.id + 1 : 1;
            const newPur = new Purchase({ ...payload, id });
            await newPur.save();
            callback(null, newPur);
        } catch (err) {
            callback(err);
        }
    },

    createSupplierPayment: async (payload, callback) => {
        try {
            const lastPay = await SupplierPayment.findOne().sort({ id: -1 });
            const id = lastPay ? lastPay.id + 1 : 1;
            const newPay = new SupplierPayment({ ...payload, id });
            await newPay.save();
            callback(null, newPay);
        } catch (err) {
            callback(err);
        }
    },

    // Legacy method for "INSERT INTO" style calls (Products init)
    run: async function(sql, params, callback) {
        try {
            if (sql.includes('INSERT INTO products')) {
                const lastProd = await Product.findOne().sort({ id: -1 });
                const id = lastProd ? lastProd.id + 1 : 1;
                const variants = JSON.parse(params[3] || '[]');
                variants.forEach((v, i) => v.id = `v${id}-${i + 1}`);
                
                const newProd = new Product({ id, name: params[0], category: params[1], price: params[2], variants });
                await newProd.save();
                this.lastID = id;
            }
            callback.call(this, null);
        } catch (err) {
            callback(err);
        }
    }
};

module.exports = db;
