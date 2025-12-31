require('dotenv').config();

module.exports = {
    api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
        timeout: 30000
    },
    llm: {
        provider: process.env.LLM_PROVIDER ,
        groqApiKey: process.env.GROQ_API_KEY ,
        model:  process.env.LLM_MODEL ,// Fast and free,
        maxTokens: 4000
    },
    search: {
        engine: process.env.SEARCH_ENGINE || 'google',
        resultsToFetch: 2,
        timeout: 15000
    },
    scraper: {
        timeout: 15000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
};