// controllers/articleController.js - COMPLETE FILE WITH DATE FIX
const db = require('../config/database');
const scraper = require('../services/scraper');

// Helper function to safely parse tags
function safeParseTags(tagsValue) {
    if (!tagsValue) {
        return [];
    }

    if (Array.isArray(tagsValue)) {
        return tagsValue;
    }

    const tagsString = String(tagsValue).trim();

    if (tagsString === '') {
        return [];
    }

    try {
        const parsed = JSON.parse(tagsString);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [parsed];
    } catch (e) {
        if (tagsString.includes(',')) {
            return tagsString.split(',').map(t => t.trim()).filter(t => t);
        }
        return [tagsString];
    }
}

// ✅ Helper function to format date for MySQL
function formatDateForMySQL(dateValue) {
    if (!dateValue) {
        return null;
    }

    // If it's already a simple date string (YYYY-MM-DD), return as-is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
    }

    // If it's an ISO string with time (2023-12-10T18:30:00.000Z)
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
        // Extract just the date part: YYYY-MM-DD
        return dateValue.split('T')[0];
    }

    // If it's a Date object
    if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
    }

    // Fallback: try to parse and extract date
    try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        console.error('Error parsing date:', e);
    }

    return null;
}

class ArticleController {
    // CREATE - Scrape and store articles
    async scrapeAndStore(req, res) {
        try {
            const articles = await scraper.scrapeOldestArticles();
            
            const insertedArticles = [];
            for (const article of articles) {
                const tagsArray = safeParseTags(article.tags);
                const tagsJson = JSON.stringify(tagsArray);
                const formattedDate = formatDateForMySQL(article.publish_date);

                const [result] = await db.query(
                    `INSERT INTO articles (title, url, author, publish_date, excerpt, tags, image_url) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     title = VALUES(title),
                     author = VALUES(author),
                     publish_date = VALUES(publish_date),
                     excerpt = VALUES(excerpt),
                     tags = VALUES(tags),
                     image_url = VALUES(image_url)`,
                    [
                        article.title,
                        article.url,
                        article.author,
                        formattedDate,
                        article.excerpt,
                        tagsJson,
                        article.image_url
                    ]
                );
                
                insertedArticles.push({
                    id: result.insertId,
                    ...article,
                    tags: tagsArray
                });
            }

            res.status(201).json({
                success: true,
                message: `Successfully scraped and stored ${insertedArticles.length} articles`,
                data: insertedArticles
            });
        } catch (error) {
            console.error('Error in scrapeAndStore:', error);
            res.status(500).json({
                success: false,
                message: 'Error scraping and storing articles',
                error: error.message
            });
        }
    }

    // CREATE - Add single article manually
    async createArticle(req, res) {
        try {
            const { title, url, author, publish_date, excerpt, tags, image_url } = req.body;

            if (!title || !url) {
                return res.status(400).json({
                    success: false,
                    message: 'Title and URL are required'
                });
            }

            const tagsArray = safeParseTags(tags);
            const tagsJson = JSON.stringify(tagsArray);
            const formattedDate = formatDateForMySQL(publish_date);

            const [result] = await db.query(
                `INSERT INTO articles (title, url, author, publish_date, excerpt, tags, image_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [title, url, author, formattedDate, excerpt, tagsJson, image_url]
            );

            res.status(201).json({
                success: true,
                message: 'Article created successfully',
                data: {
                    id: result.insertId,
                    title,
                    url,
                    author,
                    publish_date: formattedDate,
                    excerpt,
                    tags: tagsArray,
                    image_url
                }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Article with this URL already exists'
                });
            }
            console.error('Error in createArticle:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating article',
                error: error.message
            });
        }
    }

    // READ - Get all articles
    async getAllArticles(req, res) {
        try {
            const [articles] = await db.query(
                'SELECT * FROM articles ORDER BY publish_date DESC'
            );

            const parsedArticles = articles.map(article => {
                return {
                    ...article,
                    tags: safeParseTags(article.tags)
                };
            });

            res.status(200).json({
                success: true,
                count: parsedArticles.length,
                data: parsedArticles
            });
        } catch (error) {
            console.error('Error in getAllArticles:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching articles',
                error: error.message
            });
        }
    }

    // READ - Get single article by ID
    async getArticleById(req, res) {
        try {
            const { id } = req.params;

            const [articles] = await db.query(
                'SELECT * FROM articles WHERE id = ?',
                [id]
            );

            if (articles.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found'
                });
            }

            const article = {
                ...articles[0],
                tags: safeParseTags(articles[0].tags)
            };

            res.status(200).json({
                success: true,
                data: article
            });
        } catch (error) {
            console.error('Error in getArticleById:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching article',
                error: error.message
            });
        }
    }

    // UPDATE - Update article by ID
    async updateArticle(req, res) {
        try {
            const { id } = req.params;
            const { title, url, author, publish_date, excerpt, tags, image_url } = req.body;

            // ✅ Format date for MySQL
            const formattedDate = formatDateForMySQL(publish_date);

            // ✅ Format tags as JSON
            const tagsArray = safeParseTags(tags);
            const tagsJson = JSON.stringify(tagsArray);

            const [result] = await db.query(
                `UPDATE articles 
                 SET title = ?, url = ?, author = ?, publish_date = ?, 
                     excerpt = ?, tags = ?, image_url = ?
                 WHERE id = ?`,
                [title, url, author, formattedDate, excerpt, tagsJson, image_url, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Article updated successfully',
                data: {
                    id,
                    title,
                    url,
                    author,
                    publish_date: formattedDate,
                    excerpt,
                    tags: tagsArray,
                    image_url
                }
            });
        } catch (error) {
            console.error('Error in updateArticle:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating article',
                error: error.message
            });
        }
    }

    // DELETE - Delete article by ID
    async deleteArticle(req, res) {
        try {
            const { id } = req.params;

            const [result] = await db.query(
                'DELETE FROM articles WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Article deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteArticle:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting article',
                error: error.message
            });
        }
    }
}

module.exports = new ArticleController();