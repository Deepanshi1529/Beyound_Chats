// services/googleSearchService.js
const axios = require('axios');
const cheerio = require('cheerio');

class GoogleSearchService {
    async searchGoogle(query, numResults = 2) {
        console.log(`Searching for: "${query}"`);
        
        // Try multiple search engines in order
        const searchMethods = [
            () => this.searchDuckDuckGo(query, numResults),
            () => this.searchBing(query, numResults),
            () => this.searchGoogle_Direct(query, numResults)
        ];

        for (const method of searchMethods) {
            try {
                const results = await method();
                if (results && results.length > 0) {
                    return results;
                }
            } catch (error) {
                console.log(`Search method failed, trying next...`);
            }
        }

        console.warn('All search methods failed');
        return [];
    }

    // Method 1: DuckDuckGo (Most Reliable)
    async searchDuckDuckGo(query, numResults = 2) {
        try {
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' blog article')}`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const results = [];

            $('.result').each((index, element) => {
                if (results.length >= numResults) return false;

                const titleElement = $(element).find('.result__a');
                const snippetElement = $(element).find('.result__snippet');
                const urlElement = $(element).find('.result__url');
                
                const title = titleElement.text().trim();
                let url = titleElement.attr('href');

                // DuckDuckGo uses redirect URLs, extract the real URL
                if (url && url.includes('uddg=')) {
                    const urlMatch = url.match(/uddg=([^&]+)/);
                    if (urlMatch) {
                        url = decodeURIComponent(urlMatch[1]);
                    }
                }

                if (url && url.startsWith('http') && !url.includes('duckduckgo.com')) {
                    results.push({
                        title: title || 'No title',
                        url: url,
                        snippet: snippetElement.text().trim() || ''
                    });
                }
            });

            console.log(`✓ DuckDuckGo found ${results.length} results`);
            return results;

        } catch (error) {
            console.error('DuckDuckGo search failed:', error.message);
            throw error;
        }
    }

    // Method 2: Bing Search (Good Alternative)
    async searchBing(query, numResults = 2) {
        try {
            const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query + ' blog article')}`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const results = [];

            $('.b_algo').each((index, element) => {
                if (results.length >= numResults) return false;

                const titleElement = $(element).find('h2 a');
                const snippetElement = $(element).find('.b_caption p');
                
                const title = titleElement.text().trim();
                const url = titleElement.attr('href');

                if (url && url.startsWith('http') && !url.includes('bing.com')) {
                    results.push({
                        title: title || 'No title',
                        url: url,
                        snippet: snippetElement.text().trim() || ''
                    });
                }
            });

            console.log(`✓ Bing found ${results.length} results`);
            return results;

        } catch (error) {
            console.error('Bing search failed:', error.message);
            throw error;
        }
    }

    // Method 3: Google Direct (Often Blocked)
    async searchGoogle_Direct(query, numResults = 2) {
        try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' blog article')}&num=10`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'max-age=0'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const results = [];

            // Try multiple Google selectors
            const selectors = ['.g', '#search .g', '.Gx5Zad'];
            
            for (const selector of selectors) {
                $(selector).each((index, element) => {
                    if (results.length >= numResults) return false;

                    const titleElement = $(element).find('h3').first();
                    const linkElement = $(element).find('a').first();
                    const snippetElement = $(element).find('.VwiC3b, .s, .st').first();
                    
                    const title = titleElement.text().trim();
                    const url = linkElement.attr('href');

                    if (url && url.startsWith('http') && !url.includes('google.com')) {
                        results.push({
                            title: title || 'No title',
                            url: url,
                            snippet: snippetElement.text().trim() || ''
                        });
                    }
                });

                if (results.length > 0) break;
            }

            console.log(`✓ Google found ${results.length} results`);
            return results;

        } catch (error) {
            console.error('Google search failed:', error.message);
            throw error;
        }
    }

    // Method 4: Manual fallback URLs (for testing)
    getManualResults(query, numResults = 2) {
        console.log('Using manual fallback results for testing');
        
        // Updated with working URLs
        const fallbackUrls = {
            'sales chatbot': [
                { title: 'How Chatbots Boost Sales Conversions', url: 'https://beyondchats.com/blogs/boost-conversion-rate-using-chatbots/', snippet: 'AI chatbots guide prospects through the sales funnel' },
                { title: 'Sales Chatbot Best Practices', url: 'https://www.tidio.com/blog/sales-chatbot/', snippet: 'Implementing chatbots in your sales process' }
            ],
            'customer service': [
                { title: 'Customer Service Solutions', url: 'https://beyondchats.com/blogs/common-customer-service-issues/', snippet: 'Essential skills for customer service teams' },
                { title: 'Customer Support Best Practices', url: 'https://www.zendesk.com/blog/customer-service/', snippet: 'How to provide excellent customer support' }
            ],
            'ecommerce': [
                { title: 'E-commerce Chatbot Benefits', url: 'https://beyondchats.com/blogs/boost-conversion-rate-using-chatbots/', snippet: 'Boost your online store conversions' },
                { title: 'E-commerce Conversion Strategies', url: 'https://www.shopify.com/blog/ecommerce-conversion-optimization', snippet: 'Latest trends in e-commerce' }
            ],
            'chatbot': [
                { title: 'Chatbot vs Live Chat Comparison', url: 'https://www.zoho.com/blog/salesiq/chatbot-vs-live-chat.html', snippet: 'Comparing chatbots and live chat solutions' },
                { title: 'AI Chatbot Implementation', url: 'https://hiverhq.com/blog/chatbot-vs-live-chat-what-to-choose', snippet: 'How to implement chatbots effectively' }
            ]
        };

        // Try to match query to category
        const queryLower = query.toLowerCase();
        for (const [key, urls] of Object.entries(fallbackUrls)) {
            if (queryLower.includes(key)) {
                return urls.slice(0, numResults);
            }
        }

        // Default fallback - use chatbot URLs
        return fallbackUrls['chatbot'].slice(0, numResults);
    }
}

module.exports = new GoogleSearchService();