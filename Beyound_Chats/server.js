const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const articleRoutes = require('./routes/articleRoutes');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files (React build)
app.use(express.static(path.join(__dirname, 'public')));

// Test database connection
db.query('SELECT 1')
    .then(() => {
        console.log('✓ Database connected successfully');
    })
    .catch(err => {
        console.error('✗ Database connection failed:', err.message);
        process.exit(1);
    });

// API Routes
app.use('/api', articleRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Frontend served from ${path.join(__dirname, 'public')}`);
});

module.exports = app;
