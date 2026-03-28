const db = require('../database');

const getAllSuppliers = (req, res) => {
    // We need to fetch suppliers, purchases, and payments to calculate "Balance Owed"
    db.all("SELECT * FROM suppliers", [], (err, suppliers) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all("SELECT * FROM purchases", [], (err, purchases) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.all("SELECT * FROM supplier_payments", [], (err, payments) => {
                if (err) return res.status(500).json({ error: err.message });

                // Map balances natively in memory
                const data = suppliers.map(s => {
                    const totalPurchased = purchases
                        .filter(p => p.supplier_id === s.id)
                        .reduce((acc, p) => acc + (p.total_cost || 0), 0);
                    
                    const totalInitialPaid = purchases
                        .filter(p => p.supplier_id === s.id)
                        .reduce((acc, p) => acc + (p.amount_paid || 0), 0);
                    
                    const totalLedgerPaid = (payments || [])
                        .filter(pay => pay.supplier_id === s.id)
                        .reduce((acc, pay) => acc + (pay.amount || 0), 0);
                    
                    return {
                        ...(s.toObject ? s.toObject() : s),
                        total_purchased: totalPurchased,
                        total_paid: totalInitialPaid + totalLedgerPaid,
                        balance: totalPurchased - (totalInitialPaid + totalLedgerPaid)
                    };
                });

                res.json({ message: "success", data });
            });
        });
    });
};

const createSupplier = (req, res) => {
    db.createSupplier(req.body, (err, newSupplier) => {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ message: "success", data: newSupplier });
    });
};

const createPayment = (req, res) => {
    db.createSupplierPayment(req.body, (err, newPayment) => {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ message: "success", data: newPayment });
    });
};

module.exports = { getAllSuppliers, createSupplier, createPayment };
