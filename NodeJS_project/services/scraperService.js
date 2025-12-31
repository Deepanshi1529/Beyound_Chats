// services/scraperService.js
const axios = require('axios');
const cheerio = require('cheerio');

class ScraperService {
    async scrapeMultipleArticles(urls) {
        console.log(`Scraping ${urls.length} articles...`);
        const results = [];
        
        for (const url of urls) {
            try {
                console.log(`Scraping content from: ${url}`);
                const article = await this.scrapeArticle(url);
                if (article && article.content) {
                    results.push(article);
                    console.log(`✓ Scraped ${article.content.length} characters from article`);
                } else {
                    console.warn(`⚠ No content extracted from ${url}`);
                }
            } catch (error) {
                console.error(`✗ Error scraping ${url}`);
                console.error(`  ${error.message}`);
            }
            
            // Add delay between requests
            await this.delay(2000);
        }
        
        console.log(`✓ Successfully scraped ${results.length} competitor articles`);
        return results;
    }

    async scrapeArticle(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'max-age=0'
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

            // Extract title
            const title = $('h1').first().text() || 
                         $('meta[property="og:title"]').attr('content') ||
                         $('title').text() || 
                         'No title found';

            // Only return if we got substantial content
            if (content.length < 300) {
                console.warn(`⚠ Insufficient content from ${url} (${content.length} chars)`);
                return null;
            }
            
            return {
                url,
                title: title.trim(),
                content: content.substring(0, 5000),
                scrapedAt: new Date().toISOString()
            };

        } catch (error) {
            if (error.response && error.response.status === 403) {
                throw new Error('Access forbidden (403) - Website blocking scrapers');
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout - Website took too long to respond');
            } else {
                throw new Error(error.message);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new ScraperService();