const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProductController);
router.delete('/:id', productController.deleteProductController);
router.put('/:id/variant/:variantId/stock', productController.updateStock);

module.exports = router;
