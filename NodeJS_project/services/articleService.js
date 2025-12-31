
const axios = require('axios');
const config = require('../config/config');
const Logger = require('../utils/logger');

class ArticleService {
    constructor() {
        this.baseUrl = config.api.baseUrl;
    }

    async getAllArticles() {
        try {
            Logger.info('Fetching all articles from API...');
            const response = await axios.get(`${this.baseUrl}/articles`, {
                timeout: config.api.timeout
            });

            if (response.data.success) {
                Logger.success(`Fetched ${response.data.count} articles`);
                return response.data.data;
            }

            throw new Error('Failed to fetch articles');
        } catch (error) {
            Logger.error('Error fetching articles', error.message);
            throw error;
        }
    }

    async getArticleById(id) {
        try {
            Logger.info(`Fetching article ${id}...`);
            const response = await axios.get(`${this.baseUrl}/articles/${id}`, {
                timeout: config.api.timeout
            });

            if (response.data.success) {
                Logger.success(`Fetched article: ${response.data.data.title}`);
                return response.data.data;
            }

            throw new Error(`Article ${id} not found`);
        } catch (error) {
            Logger.error(`Error fetching article ${id}`, error.message);
            throw error;
        }
    }

    async updateArticle(id, articleData) {
        try {
            Logger.info(`Updating article ${id}...`);
            const response = await axios.put(
                `${this.baseUrl}/articles/${id}`,
                articleData,
                {
                    timeout: config.api.timeout,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.success) {
                Logger.success(`Article ${id} updated successfully`);
                return response.data.data;
            }

            throw new Error('Failed to update article');
        } catch (error) {
            Logger.error(`Error updating article ${id}`, error.message);
            throw error;
        }
    }
}

module.exports = new ArticleService();