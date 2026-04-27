 
const axios = require('axios');
const cheerio = require('cheerio');

class BlogScraper {
    constructor() {
        this.baseUrl = 'https://beyondchats.com';
    }

    async scrapeBlogListPage(pageUrl) {
        try {
            const response = await axios.get(pageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 15000
            });
            
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

    async scrapeArticleContent(url) {
        try {
            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
            const response = await axios.get(fullUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 30000,
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);
            
            // Remove unwanted elements
            $('script, style, nav, footer, header, aside, .advertisement, .ads, iframe, .cookie-banner').remove();

            // Try multiple selectors for article content
            const contentSelectors = [
                'article',
                '[role="main"]',
                '.article-content',
                '.post-content',
                '.entry-content',
                '.content',
                'main',
                '.main-content',
                '#content',
                '.blog-content',
                '.post-body'
            ];

            let content = '';
            for (const selector of contentSelectors) {
                const element = $(selector).first();
                if (element.length) {
                    content = element.text();
                    if (content.length > 500) break;
                }
            }

            // Fallback: get all paragraph text
            if (!content || content.length < 500) {
                content = $('p').map((i, el) => $(el).text()).get().join('\n');
            }

            // Clean up content
            content = content
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, '\n')
                .trim();

            // Only return if we got substantial content
            if (content.length < 300) {
                console.warn(`⚠ Insufficient content from ${url} (${content.length} chars)`);
                return null;
            }
            
            return content.substring(0, 10000);
        } catch (error) {
            console.error(`Error scraping article content from ${url}:`, error.message);
            return null;
        }
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
        const selectedArticles = allArticles.slice(0, 5);

        // Now fetch full content for each article
        console.log('Fetching full article content...');
        for (const article of selectedArticles) {
            const fullUrl = article.url.startsWith('http') ? article.url : `${this.baseUrl}${article.url}`;
            console.log(`  Scraping content: ${article.title}`);
            article.content = await this.scrapeArticleContent(fullUrl);
            
            if (article.content) {
                console.log(`  ✓ Got ${article.content.length} characters`);
            } else {
                console.log(`  ⚠ No content found, using excerpt`);
                article.content = article.excerpt;
            }
            
            // Delay to be respectful
            await this.delay(2000);
        }

        return selectedArticles;
    }

    parseDate(dateString) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        
        return date.toISOString().split('T')[0];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new BlogScraper();