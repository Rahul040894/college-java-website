// uploadQuestions.js
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config(); // To use our DATABASE_URL

// Re-import our Test model from server.js (or define it here)
const TestSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    questions: [new mongoose.Schema({
        question: { type: String, required: true },
        options: { type: [String], required: true },
        answer: { type: String, required: true }
    })] 
});
const Test = mongoose.model('Test', TestSchema);


const uploadData = async () => {
    // Check if a file path was provided
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('ERROR: Please provide the path to the JSON file.');
        console.log('Usage: node uploadQuestions.js <path-to-your-json-file.json>');
        return;
    }

    try {
        // Connect to the database
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for upload.');

        // Read the JSON file
        const data = fs.readFileSync(filePath, 'utf-8');
        const testData = JSON.parse(data);

        // Check if a test with this name already exists
        const existingTest = await Test.findOne({ name: testData.name });
        if (existingTest) {
            console.warn(`⚠️ A test named "${testData.name}" already exists. Aborting.`);
            mongoose.connection.close();
            return;
        }

        // Create a new test document and save it
        const newTest = new Test(testData);
        await newTest.save();

        console.log(`✅ Successfully uploaded test: "${testData.name}"`);

    } catch (error) {
        console.error('❌ Error during upload:', error);
    } finally {
        // Always close the connection
        mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

uploadData();