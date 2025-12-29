// controllers/articleController.js
const db = require('../config/database');
const scraper = require('../services/scraper');

// Helper function to safely parse tags
function safeParseTags(tagsValue) {
    // If null or undefined, return empty array
    if (!tagsValue) {
        return [];
    }

    // If already an array, return it
    if (Array.isArray(tagsValue)) {
        return tagsValue;
    }

    // Convert to string
    const tagsString = String(tagsValue).trim();

    // If empty string, return empty array
    if (tagsString === '') {
        return [];
    }

    // Try to parse as JSON
    try {
        const parsed = JSON.parse(tagsString);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        // If it's not an array after parsing, wrap it
        return [parsed];
    } catch (e) {
        // If JSON parsing fails, try to split by comma or return as single item
        if (tagsString.includes(',')) {
            return tagsString.split(',').map(t => t.trim()).filter(t => t);
        }
        // Return as single tag
        return [tagsString];
    }
}

class ArticleController {
    // CREATE - Scrape and store articles
    async scrapeAndStore(req, res) {
        try {
            const articles = await scraper.scrapeOldestArticles();
            
            const insertedArticles = [];
            for (const article of articles) {
                // Ensure tags is proper JSON
                let tagsJson;
                try {
                    const tagsArray = safeParseTags(article.tags);
                    tagsJson = JSON.stringify(tagsArray);
                } catch (e) {
                    console.error('Error processing tags:', e);
                    tagsJson = JSON.stringify([]);
                }

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
                        article.publish_date,
                        article.excerpt,
                        tagsJson,
                        article.image_url
                    ]
                );
                
                insertedArticles.push({
                    id: result.insertId,
                    ...article,
                    tags: JSON.parse(tagsJson)
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

            // Ensure tags is proper JSON
            const tagsArray = safeParseTags(tags);
            const tagsJson = JSON.stringify(tagsArray);

            const [result] = await db.query(
                `INSERT INTO articles (title, url, author, publish_date, excerpt, tags, image_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [title, url, author, publish_date, excerpt, tagsJson, image_url]
            );

            res.status(201).json({
                success: true,
                message: 'Article created successfully',
                data: {
                    id: result.insertId,
                    title,
                    url,
                    author,
                    publish_date,
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

            // Safely parse tags for each article
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

            // Ensure tags is proper JSON
            const tagsArray = safeParseTags(tags);
            const tagsJson = JSON.stringify(tagsArray);

            const [result] = await db.query(
                `UPDATE articles 
                 SET title = ?, url = ?, author = ?, publish_date = ?, 
                     excerpt = ?, tags = ?, image_url = ?
                 WHERE id = ?`,
                [title, url, author, publish_date, excerpt, tagsJson, image_url, id]
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
                    publish_date,
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