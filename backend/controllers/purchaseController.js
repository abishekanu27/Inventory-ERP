const db = require('../database');

const getAllPurchases = (req, res) => {
    db.all("SELECT * FROM purchases", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
};

const createPurchase = (req, res) => {
    db.createPurchase(req.body, (err, newPurchase) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
            message: "success",
            data: newPurchase
        });
    });
};

module.exports = { getAllPurchases, createPurchase };
