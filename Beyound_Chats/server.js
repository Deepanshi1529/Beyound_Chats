
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const articleRoutes = require('./routes/articleRoutes');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test database connection
db.query('SELECT 1')
    .then(() => {
        console.log('✓ Database connected successfully');
    })
    .catch(err => {
        console.error('✗ Database connection failed:', err.message);
        process.exit(1);
    });

// Routes
app.use('/api/articles', articleRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ API Documentation: http://localhost:${PORT}/api/articles`);
});