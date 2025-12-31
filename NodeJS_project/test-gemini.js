// test-search.js
// Test script to verify Google/DuckDuckGo search is working

require('dotenv').config();
const googleSearchService = require('./services/googleSearchService');

async function testSearch() {
    console.log('='.repeat(60));
    console.log('TESTING SEARCH FUNCTIONALITY');
    console.log('='.repeat(60));
    
    const testQueries = [
        'sales chatbots increase conversions',
        'customer service solutions',
        'ecommerce chatbot best practices'
    ];

    for (const query of testQueries) {
        console.log(`\n🔍 Testing query: "${query}"`);
        console.log('-'.repeat(60));
        
        try {
            const results = await googleSearchService.searchGoogle(query, 2);
            
            if (results && results.length > 0) {
                console.log(`✅ SUCCESS: Found ${results.length} results\n`);
                results.forEach((result, idx) => {
                    console.log(`${idx + 1}. ${result.title}`);
                    console.log(`   URL: ${result.url}`);
                    console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
                    console.log();
                });
            } else {
                console.log('❌ FAILED: No results found');
            }
            
        } catch (error) {
            console.error('❌ ERROR:', error.message);
        }
        
        // Wait between queries
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('TESTING COMPLETE');
    console.log('='.repeat(60));
}

// Run the test
testSearch().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});