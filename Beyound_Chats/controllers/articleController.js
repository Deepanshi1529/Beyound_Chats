const db = require('../config/database');
const scraper = require('../services/scraper');

// Helper to safely parse tags
function safeParseTags(tagsValue) {
    if (!tagsValue) return [];
    if (Array.isArray(tagsValue)) return tagsValue;
    
    const tagsString = String(tagsValue).trim();
    if (tagsString === '') return [];
    
    try {
        const parsed = JSON.parse(tagsString);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        if (tagsString.includes(',')) {
            return tagsString.split(',').map(t => t.trim()).filter(t => t);
        }
        return [tagsString];
    }
}

// Format date for PostgreSQL (YYYY-MM-DD)
function formatDate(dateValue) {
    if (!dateValue) return null;
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
    }
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
        return dateValue.split('T')[0];
    }
    if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
    }
    try {
        const date = new Date(dateValue);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
    } catch (e) {
        return null;
    }
}

class ArticleController {
    // POST /api/scrape - Scrape and store articles
    async scrapeAndStore(req, res) {
        try {
            const articles = await scraper.scrapeOldestArticles();
            
            const insertedArticles = [];
            for (const article of articles) {
                const tagsArray = safeParseTags(article.tags);
                const tagsJson = JSON.stringify(tagsArray);
                const formattedDate = formatDate(article.publish_date);
                const content = article.content || article.excerpt;

                const result = await db.query(
                    `INSERT INTO articles (title, url, author, publish_date, excerpt, content, tags, image_url) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (url) DO UPDATE SET
                        title = EXCLUDED.title,
                        author = EXCLUDED.author,
                        publish_date = EXCLUDED.publish_date,
                        excerpt = EXCLUDED.excerpt,
                        content = EXCLUDED.content,
                        tags = EXCLUDED.tags,
                        image_url = EXCLUDED.image_url
                     RETURNING *`,
                    [article.title, article.url, article.author, formattedDate, article.excerpt, content, tagsJson, article.image_url]
                );
                
                insertedArticles.push({
                    id: result.rows[0].id,
                    title: article.title,
                    url: article.url,
                    author: article.author,
                    publish_date: formattedDate,
                    excerpt: article.excerpt,
                    content: content,
                    tags: tagsArray,
                    image_url: article.image_url
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

    // POST /api/articles - Create article
    async createArticle(req, res) {
        try {
            const { title, url, author, publish_date, excerpt, content, tags, image_url } = req.body;

            if (!title || !url) {
                return res.status(400).json({
                    success: false,
                    message: 'Title and URL are required'
                });
            }

            const tagsArray = safeParseTags(tags);
            const tagsJson = JSON.stringify(tagsArray);
            const formattedDate = formatDate(publish_date);
            const articleContent = content || excerpt;

            const result = await db.query(
                `INSERT INTO articles (title, url, author, publish_date, excerpt, content, tags, image_url) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [title, url, author, formattedDate, excerpt, articleContent, tagsJson, image_url]
            );

            res.status(201).json({
                success: true,
                message: 'Article created successfully',
                data: {
                    id: result.rows[0].id,
                    title,
                    url,
                    author,
                    publish_date: formattedDate,
                    excerpt,
                    content: articleContent,
                    tags: tagsArray,
                    image_url
                }
            });
        } catch (error) {
            if (error.code === '23505') { // PostgreSQL unique violation
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

    // GET /api/articles - Get all articles
    async getAllArticles(req, res) {
        try {
            const result = await db.query(
                'SELECT * FROM articles ORDER BY publish_date DESC'
            );

            const parsedArticles = result.rows.map(article => ({
                ...article,
                tags: safeParseTags(article.tags)
            }));

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

    // GET /api/articles/:id - Get single article
    async getArticleById(req, res) {
        try {
            const { id } = req.params;

            const result = await db.query(
                'SELECT * FROM articles WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found'
                });
            }

            const article = {
                ...result.rows[0],
                tags: safeParseTags(result.rows[0].tags)
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

    // PUT /api/articles/:id - Update article
    async updateArticle(req, res) {
        try {
            const { id } = req.params;
            const { title, url, author, publish_date, excerpt, content, tags, image_url } = req.body;

            const formattedDate = formatDate(publish_date);
            const tagsArray = safeParseTags(tags);
            const tagsJson = JSON.stringify(tagsArray);
            const articleContent = content || excerpt;

            const result = await db.query(
                `UPDATE articles 
                 SET title = $1, url = $2, author = $3, publish_date = $4, 
                     excerpt = $5, content = $6, tags = $7, image_url = $8
                 WHERE id = $9
                 RETURNING *`,
                [title, url, author, formattedDate, excerpt, articleContent, tagsJson, image_url, id]
            );

            if (result.rows.length === 0) {
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
                    content: articleContent,
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

    // DELETE /api/articles/:id - Delete article
    async deleteArticle(req, res) {
        try {
            const { id } = req.params;

            const result = await db.query(
                'DELETE FROM articles WHERE id = $1',
                [id]
            );

            if (result.rowCount === 0) {
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
