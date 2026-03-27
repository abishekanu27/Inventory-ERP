const express = require('express');
const cors = require('cors');
const path = require('path'); // Core path mapping
const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
const db = require('./database');
const cors = require("cors");

app.use(cors({
  origin: "*"
}));

// Middleware
app.use(cors());
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
// We serve the built React files from the single backend port 5000
const frontendDist = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Wildcard for React SPA Router (all non-API routes serve index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${PORT}`);
});