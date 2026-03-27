const db = require('../database');

const getAllProducts = (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
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

const createProduct = (req, res) => {
    // variants expected as Array: [{size, color, stock}]
    const { name, category, price, variants } = req.body;
    db.run(
        'INSERT INTO products (name, category, price, variants)',
        [name, category, price, JSON.stringify(variants || [])],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({
                message: "success",
                data: { id: this.lastID, name, category, price, variants }
            });
        }
    );
};

const updateStock = (req, res) => {
    const { id, variantId } = req.params;
    const { qtyChange } = req.body; // e.g., 1 or -1 or 10

    if (!qtyChange || isNaN(qtyChange)) {
         return res.status(400).json({ error: "Invalid qtyChange value" });
    }

    db.updateStock(id, variantId, qtyChange, (err, newStock) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            newStock
        });
    });
};

const updateProductController = (req, res) => {
    const { id } = req.params;
    const body = req.body;
    db.updateProduct(id, body, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "updated" });
    });
};

const deleteProductController = (req, res) => {
    const { id } = req.params;
    db.deleteProduct(id, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "deleted" });
    });
};

module.exports = {
    getAllProducts,
    createProduct,
    updateStock,
    updateProductController,
    deleteProductController
};
