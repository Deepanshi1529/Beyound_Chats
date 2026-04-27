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
    res.json({ status: 'OK', message: 'Server is running', version: '2.0.1' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create articles table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS articles (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                url VARCHAR(500) UNIQUE NOT NULL,
                author VARCHAR(255),
                publish_date DATE,
                excerpt TEXT,
                content TEXT,
                tags JSONB,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(createTableQuery);

        // Check if content column exists, add if missing
        const columnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'articles' AND column_name = 'content'
        `);
        
        if (columnCheck.rows.length === 0) {
            await db.query(`ALTER TABLE articles ADD COLUMN content TEXT`);
            console.log('✓ Added content column to articles table');
        }

        console.log('✓ Database schema initialized');
    } catch (error) {
        console.error('✗ Database initialization failed:', error.message);
        throw error;
    }
}

// Fetch full article content from URL
async function fetchArticleContent(url) {
    try {
        const axios = require('axios');
        const cheerio = require('cheerio');
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 30000,
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header, aside, .advertisement, .ads, iframe, .cookie-banner').remove();

        const contentSelectors = [
            'article', '[role="main"]', '.article-content', '.post-content',
            '.entry-content', '.content', 'main', '.main-content', '#content',
            '.blog-content', '.post-body'
        ];

        let content = '';
        for (const selector of contentSelectors) {
            const element = $(selector).first();
            if (element.length) {
                content = element.text();
                if (content.length > 500) break;
            }
        }

        if (!content || content.length < 500) {
            content = $('p').map((i, el) => $(el).text()).get().join('\n');
        }

        content = content.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();

        return content.length > 300 ? content.substring(0, 10000) : null;
    } catch (error) {
        console.error(`Error fetching content from ${url}:`, error.message);
        return null;
    }
}

// Migration: populate content for existing articles that have no content
async function migrateExistingArticles() {
    try {
        const result = await db.query(
            'SELECT id, title, url FROM articles WHERE content IS NULL OR content = \'\''
        );
        
        if (result.rows.length === 0) {
            console.log('✓ All articles already have content');
            return;
        }

        console.log(`Migrating ${result.rows.length} articles to add full content...`);
        
        for (const article of result.rows) {
            console.log(`  Fetching content for: ${article.title}`);
            const content = await fetchArticleContent(article.url);
            
            if (content) {
                await db.query(
                    'UPDATE articles SET content = $1 WHERE id = $2',
                    [content, article.id]
                );
                console.log(`  ✓ Updated article ${article.id} with ${content.length} chars`);
            } else {
                console.log(`  ⚠ Could not fetch content for article ${article.id}, using excerpt`);
                const excerptResult = await db.query(
                    'SELECT excerpt FROM articles WHERE id = $1',
                    [article.id]
                );
                if (excerptResult.rows[0].excerpt) {
                    await db.query(
                        'UPDATE articles SET content = $1 WHERE id = $2',
                        [excerptResult.rows[0].excerpt, article.id]
                    );
                }
            }
            
            // Be respectful - delay between requests
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        console.log('✓ Migration completed');
    } catch (error) {
        console.error('✗ Migration failed:', error.message);
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
            // Run content migration in background
            migrateExistingArticles().catch(console.error);
        });
    } catch (err) {
        console.error('✗ Server start failed:', err.message);
        process.exit(1);
    }
}

start();

module.exports = app;
