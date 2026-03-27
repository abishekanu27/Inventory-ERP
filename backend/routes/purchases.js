const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.get('/', purchaseController.getAllPurchases);
router.post('/', purchaseController.createPurchase);

module.exports = router;
