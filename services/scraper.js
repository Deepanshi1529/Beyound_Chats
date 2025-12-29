
const axios = require('axios');
const cheerio = require('cheerio');

class BlogScraper {
    constructor() {
        this.baseUrl = 'https://beyondchats.com';
    }

    async scrapeBlogListPage(pageUrl) {
        try {
            const response = await axios.get(pageUrl);
            const $ = cheerio.load(response.data);
            const articles = [];

            // Find all article elements
            $('article').each((index, element) => {
                const $article = $(element);
                
                const title = $article.find('h2 a').text().trim();
                const url = $article.find('h2 a').attr('href');
                const author = $article.find('.author a').text().trim() || 
                              $article.find('a[rel="author"]').text().trim();
                const dateText = $article.find('time').text().trim() || 
                                $article.find('.published').text().trim();
                const excerpt = $article.find('p').first().text().trim();
                const imageUrl = $article.find('img').attr('src');
                
                // Extract tags
                const tags = [];
                $article.find('a[rel="tag"]').each((i, tag) => {
                    tags.push($(tag).text().trim());
                });

                if (title && url) {
                    articles.push({
                        title,
                        url,
                        author,
                        publish_date: this.parseDate(dateText),
                        excerpt,
                        tags: JSON.stringify(tags),
                        image_url: imageUrl
                    });
                }
            });

            return articles;
        } catch (error) {
            console.error('Error scraping blog list:', error.message);
            throw error;
        }
    }

    parseDate(dateString) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        
        return date.toISOString().split('T')[0];
    }

    async scrapeOldestArticles() {
        console.log('Scraping oldest articles from BeyondChats...');
        
        // Scrape page 14 and 15 to get oldest 5 articles
        const page15Articles = await this.scrapeBlogListPage(
            `${this.baseUrl}/blogs/page/15/`
        );
        const page14Articles = await this.scrapeBlogListPage(
            `${this.baseUrl}/blogs/page/14/`
        );

        // Combine and get first 5
        const allArticles = [...page15Articles, ...page14Articles];
        return allArticles.slice(0, 5);
    }
}

module.exports = new BlogScraper();