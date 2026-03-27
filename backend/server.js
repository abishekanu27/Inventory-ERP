const express = require('express');
const cors = require('cors');
const path = require('path'); // Core path mapping
const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
const db = require('./database');
// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// API Routes
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

// --- STATIC HOSTING: CLOTHERP UNITY ---
// Skip static serving on Vercel (Vercel handles it via vercel.json)
if (!process.env.VERCEL) {
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;