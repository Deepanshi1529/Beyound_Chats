
// fixDatabase.js
// Run this script to fix invalid JSON in the tags column

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log('Connected to database...');

        // Get all articles
        const [articles] = await connection.query('SELECT id, tags FROM articles');
        
        console.log(`Found ${articles.length} articles to check...`);

        let fixedCount = 0;

        for (const article of articles) {
            try {
                // Try to parse the existing tags
                JSON.parse(article.tags);
                console.log(`✓ Article ${article.id}: Tags already valid JSON`);
            } catch (e) {
                // If parsing fails, fix the tags
                let fixedTags;
                
                if (!article.tags || article.tags.trim() === '') {
                    // Empty or null tags
                    fixedTags = JSON.stringify([]);
                } else {
                    // Try to convert string to array
                    // Remove any existing brackets and quotes
                    let cleanTags = article.tags
                        .replace(/^\[|\]$/g, '')  // Remove surrounding brackets
                        .replace(/['"]/g, '')      // Remove quotes
                        .split(',')                // Split by comma
                        .map(tag => tag.trim())    // Trim whitespace
                        .filter(tag => tag);       // Remove empty strings
                    
                    fixedTags = JSON.stringify(cleanTags);
                }

                // Update the database
                await connection.query(
                    'UPDATE articles SET tags = ? WHERE id = ?',
                    [fixedTags, article.id]
                );

                console.log(`✓ Article ${article.id}: Fixed tags from "${article.tags}" to ${fixedTags}`);
                fixedCount++;
            }
        }

        console.log(`\n✅ Complete! Fixed ${fixedCount} articles.`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

// Run the fix
fixDatabase();