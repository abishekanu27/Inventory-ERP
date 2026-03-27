const db = require('../database');

const getAllCustomers = (req, res) => {
    db.all("SELECT * FROM customers", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
};

module.exports = { getAllCustomers };
