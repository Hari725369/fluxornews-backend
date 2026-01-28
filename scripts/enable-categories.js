require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected: ' + mongoose.connection.host);
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    try {
        // Update all categories to be visible in header
        const result = await Category.updateMany(
            {},
            { $set: { showInHeader: true, isActive: true } }
        );

        console.log(`Updated ${result.modifiedCount} categories to be visible in header.`);
        console.log('Matched documents:', result.matchedCount);

    } catch (error) {
        console.error('Error updating categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Database disconnected');
    }
};

run();
