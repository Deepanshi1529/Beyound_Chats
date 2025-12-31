const articleService = require('./services/articleService');
const googleSearchService = require('./services/googlesearchService');
const scraperService = require('./services/scraperService');
const llmService = require('./services/llmService');
const Logger = require('./utils/logger');

class ArticleOptimizer {
    constructor() {
        this.testMode = process.env.TEST_MODE === 'true';
        this.useManualFallback = process.env.USE_MANUAL_FALLBACK === 'true';
    }

    async run() {
        try {
            Logger.info('='.repeat(60));
            Logger.info('ARTICLE OPTIMIZER STARTED');
            if (this.testMode) {
                Logger.warn('RUNNING IN TEST MODE - Skipping Google & Scraping');
            }
            if (this.useManualFallback) {
                Logger.warn('MANUAL FALLBACK ENABLED - Will use preset URLs if search fails');
            }
            Logger.info('='.repeat(60));

            Logger.step(1, 'Fetching articles from API...');
            const articles = await articleService.getAllArticles();

            if (articles.length === 0) {
                Logger.warn('No articles found in database');
                return;
            }

            const articlesToProcess = articles.slice(0, 2);
            Logger.info(`Processing ${articlesToProcess.length} articles...`);

            for (const article of articlesToProcess) {
                await this.processArticle(article);
                Logger.info('Waiting before processing next article...');
                await this.delay(3000);
            }

            Logger.success('All articles processed successfully!');
            Logger.info('='.repeat(60));

        } catch (error) {
            Logger.error('Fatal error in article optimizer', error);
            process.exit(1);
        }
    }

    async processArticle(article) {
        try {
            Logger.info('\n' + '='.repeat(60));
            Logger.info(`Processing: ${article.title}`);
            Logger.info('='.repeat(60));

            let searchResults = [];
            let scrapedArticles = [];

            if (this.testMode) {
                Logger.step(2, 'TEST MODE: Skipping Google search');
                Logger.step(3, 'TEST MODE: Skipping web scraping');
                scrapedArticles = [];
            } else {
                try {
                    Logger.step(2, 'Searching for competitor articles...');
                    
                    // Simplify search query by extracting keywords
                    let searchQuery = article.title;
                    
                    // Remove special characters and extract main keywords
                    searchQuery = searchQuery
                        .replace(/[:\-\?\!]/g, ' ')
                        .split(' ')
                        .filter(word => word.length > 3) // Keep words longer than 3 chars
                        .slice(0, 5) // Take first 5 keywords
                        .join(' ');
                    
                    Logger.info(`Search query: "${searchQuery}"`);
                    searchResults = await googleSearchService.searchGoogle(searchQuery);

                    // Fallback to manual results if search failed
                    if (searchResults.length === 0 && this.useManualFallback) {
                        Logger.warn('Search failed, using manual fallback URLs');
                        searchResults = googleSearchService.getManualResults(article.title);
                    }

                    if (searchResults.length > 0) {
                        Logger.info(`Found ${searchResults.length} competitor articles`);
                        Logger.info('Competitor URLs:');
                        searchResults.forEach((result, idx) => {
                            Logger.info(`  ${idx + 1}. ${result.url}`);
                        });
                        
                        Logger.step(3, 'Scraping competitor articles...');
                        const competitorUrls = searchResults.map(r => r.url);
                        scrapedArticles = await scraperService.scrapeMultipleArticles(competitorUrls);
                        
                        if (scrapedArticles.length > 0) {
                            Logger.success(`Successfully scraped ${scrapedArticles.length} competitor articles`);
                        } else {
                            Logger.warn('Scraping failed for all competitors');
                        }
                    } else {
                        Logger.warn('No search results found, continuing with LLM-only optimization');
                    }
                } catch (error) {
                    Logger.warn(`Search/scraping error: ${error.message}`);
                    Logger.info('Continuing with LLM-only optimization');
                }
            }

            Logger.step(4, 'Optimizing article with LLM...');
            const optimizedContent = await llmService.optimizeArticle(article, scrapedArticles);

            if (!optimizedContent) {
                throw new Error('LLM returned empty content');
            }

            Logger.step(5, 'Adding metadata and citations...');
            const finalContent = llmService.addCitations(optimizedContent, searchResults);
            Logger.info(`Generated ${finalContent.length} characters of optimized content`);

            Logger.step(6, 'Publishing updated article to API...');
            const plainText = optimizedContent.replace(/[#*\-`]/g, '').trim();
            const excerpt = plainText.substring(0, 497) + '...';

            const MAX_CONTENT_LENGTH = 10000;
            const safeContent =
             finalContent.length > MAX_CONTENT_LENGTH
             ? finalContent.slice(0, MAX_CONTENT_LENGTH)
             : finalContent;

            const updatedArticle = {
                title: article.title,
                url: article.url,
                author: article.author,
                content: safeContent,
                publish_date: article.publish_date,
                excerpt: excerpt,
                tags: [...new Set([...article.tags, 'optimized', 'ai-enhanced'])],
                image_url: article.image_url
            };

            await articleService.updateArticle(article.id, updatedArticle);
            Logger.success(`✓ Article "${article.title}" optimized and published!`);
            
            // Log statistics
            Logger.info(`Statistics:`);
            Logger.info(`  - Original length: ${article.content ? article.content.length : 0} chars`);
            Logger.info(`  - Optimized length: ${safeContent ? safeContent.length : 0} chars`);
            Logger.info(`  - Competitors analyzed: ${scrapedArticles ? scrapedArticles.length : 0}`);
            Logger.info(`  - Citations added: ${searchResults ? searchResults.length : 0}`);

        } catch (error) {
            Logger.error(`Error processing article: ${article.title}`, error.message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const optimizer = new ArticleOptimizer();
optimizer.run().catch(error => {
    Logger.error('Unhandled error', error);
    process.exit(1);
});