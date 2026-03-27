const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const dbPath = path.resolve(__dirname, 'erp.json');

async function migrate() {
    console.log("Starting Migration...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to Atlas.");

    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Define temporary schemas for migration
    const schemas = {
        Product: mongoose.model('Product', new mongoose.Schema({ id: Number, name: String, category: String, price: Number, variants: Array })),
        Invoice: mongoose.model('Invoice', new mongoose.Schema({ id: Number, customer_name: String, customer_phone: String, customer_address: String, items: Array, subtotal: Number, discount_pct: Number, discount: Number, total_amount: Number, payment_mode: String, created_at: Date })),
        Customer: mongoose.model('Customer', new mongoose.Schema({ id: Number, name: String, phone: String, address: String, total_spent: Number, total_orders: Number, created_at: Date })),
        Supplier: mongoose.model('Supplier', new mongoose.Schema({ id: Number, name: String, phone: String, address: String, created_at: Date })),
        Purchase: mongoose.model('Purchase', new mongoose.Schema({ id: Number, supplier_id: Number, supplier_name: String, items: Array, total_cost: Number, amount_paid: Number, date: Date })),
        SupplierPayment: mongoose.model('SupplierPayment', new mongoose.Schema({ id: Number, supplier_id: Number, amount: Number, note: String, date: Date }))
    };

    // Migrate each collection
    const keys = ['products', 'invoices', 'customers', 'suppliers', 'purchases', 'supplier_payments'];
    const models = ['Product', 'Invoice', 'Customer', 'Supplier', 'Purchase', 'SupplierPayment'];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const modelName = models[i];
        const Model = schemas[modelName];

        if (dbData[key] && dbData[key].length > 0) {
            console.log(`Migrating ${key}...`);
            await Model.deleteMany({}); // Start clean in Atlas
            await Model.insertMany(dbData[key]);
            console.log(`Successfully migrated ${dbData[key].length} ${key}.`);
        }
    }

    console.log("Migration Completed Successfully!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration Failed:", err);
    process.exit(1);
});
