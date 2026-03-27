const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
const db = require('./database');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const productsRouter = require('./routes/products');
const invoicesRouter = require('./routes/invoices');
const customersRouter = require('./routes/customers');
const suppliersRouter = require('./routes/suppliers');
const purchasesRouter = require('./routes/purchases');

app.use('/api/products', productsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);

app.get('/', (req, res) => {
  res.send('ClothERP API Running');
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
