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
    origin: process.env.FRONTEND_URL || true,
    credentials: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files (React build)
app.use(express.static(path.join(__dirname, 'public')));

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

// Initialize database tables
async function initializeDatabase() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS articles (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                url VARCHAR(500) UNIQUE NOT NULL,
                author VARCHAR(255),
                publish_date DATE,
                excerpt TEXT,
                tags JSONB,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(createTableQuery);
        console.log('✓ Database schema initialized');
    } catch (error) {
        console.error('✗ Database initialization failed:', error.message);
        throw error;
    }
}

// Start server after database is ready
async function start() {
    try {
        await db.query('SELECT 1');
        console.log('✓ Database connected successfully');
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`✓ Server running on http://localhost:${PORT}`);
            console.log(`✓ Frontend served from ${path.join(__dirname, 'public')}`);
        });
    } catch (err) {
        console.error('✗ Server start failed:', err.message);
        process.exit(1);
    }
}

start();

module.exports = app;
