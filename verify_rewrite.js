require('dotenv').config();
const mongoose = require('mongoose');
const ArticleService = require('./src/services/articleService');
const connectDB = require('./src/config/database');

// Register models to prevent MissingSchemaError during populate
require('./src/models/AdminUser');
require('./src/models/Category');
require('./src/models/Tag'); // Tag is also populated


async function verify() {
    try {
        console.log('Connecting to DB...');
        await connectDB();
        console.log('Connected.');

        console.log('\n--- Testing listArticles (Public) ---');
        const publicResult = await ArticleService.listArticles({ limit: 5 });
        console.log('Public Articles Found:', publicResult.count);
        if (publicResult.data.length > 0) {
            console.log('First Public Article:', publicResult.data[0].title);
        }

        console.log('\n--- Testing listArticles (Writer Context) ---');
        // Mock a writer user
        const writerUser = { _id: new mongoose.Types.ObjectId(), role: 'writer' };
        // This might return 0 if that random ID has no articles, but it verifies the query building works
        const writerResult = await ArticleService.listArticles({ status: 'draft' }, writerUser);
        console.log('Writer Drafts Found (expect 0 for random ID):', writerResult.count);

        if (publicResult.data.length > 0) {
            const slug = publicResult.data[0].slug;
            console.log(`\n--- Testing getBySlug (${slug}) ---`);
            const article = await ArticleService.getBySlug(slug);
            console.log('Article Found:', article ? 'Yes' : 'No');
            if (article) console.log('Title:', article.title);

            console.log(`\n--- Testing getRelatedArticles (${article._id}) ---`);
            const related = await ArticleService.getRelatedArticles(article._id);
            console.log('Related Articles Found:', related.length);
        }

        console.log('\n✅ Verification Complete.');
    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

verify();
