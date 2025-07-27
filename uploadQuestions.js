// uploadQuestions.js (Corrected Version)

const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Define the schema EXACTLY as it is in server.js for PracticeTest
const PracticeTestSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    questions: [new mongoose.Schema({
        question: { type: String, required: true },
        options: { type: [String], required: true },
        answer: { type: String, required: true }
    })]
});
// THIS IS THE FIX: Use the 'PracticeTest' model name
const PracticeTest = mongoose.model('PracticeTest', PracticeTestSchema);

const uploadData = async () => {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('ERROR: Please provide the path to the JSON file.');
        return;
    }

    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for practice test upload.');

        const data = fs.readFileSync(filePath, 'utf-8');
        const testData = JSON.parse(data);

        // Use findOneAndUpdate with upsert: it will create the test if it doesn't exist,
        // or update it if a test with the same name already exists.
        await PracticeTest.findOneAndUpdate({ name: testData.name }, testData, { upsert: true, new: true });

        console.log(`✅ Successfully uploaded/updated practice test: "${testData.name}"`);

    } catch (error) {
        console.error('❌ Error during upload:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

uploadData();