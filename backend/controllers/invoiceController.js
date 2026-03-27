const db = require('../database');

const getAllInvoices = (req, res) => {
    db.all("SELECT * FROM invoices", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
};

const createInvoice = (req, res) => {
    db.createInvoice(req.body, (err, newInvoice) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
            message: "success",
            data: newInvoice
        });
    });
};

module.exports = {
    getAllInvoices,
    createInvoice
};
