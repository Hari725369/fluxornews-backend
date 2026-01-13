require('dotenv').config();
const mongoose = require('mongoose');

// Replace with your actual connection string
const MONGODB_URI = 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@fluxornews.edt2frq.mongodb.net/fluxornews?retryWrites=true&w=majority';

console.log('🔍 Testing MongoDB Atlas connection...\n');

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB Atlas connection successful!');
        console.log('📊 Database:', mongoose.connection.db.databaseName);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📁 Collections found:', collections.length);
        collections.forEach(col => {
            console.log('  -', col.name);
        });

        console.log('\n✅ All checks passed! Your MongoDB Atlas is ready for production.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ MongoDB Atlas connection failed!');
        console.error('Error:', err.message);
        console.error('\n💡 Troubleshooting:');
        console.error('  1. Check your username and password');
        console.error('  2. Ensure IP address is whitelisted (0.0.0.0/0)');
        console.error('  3. Verify database name is correct');
        process.exit(1);
    });
