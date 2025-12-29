
const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Scraping route
router.post('/scrape', articleController.scrapeAndStore);

// CRUD routes
router.post('/', articleController.createArticle);
router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.getArticleById);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);

module.exports = router;