// uploadQuestions.js (Final Corrected Version)
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const PracticeTestSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    questions: [new mongoose.Schema({ question: String, options: [String], answer: String }, { _id: true })]
});
const PracticeTest = mongoose.model('PracticeTest', PracticeTestSchema);

const uploadData = async () => {
    const filePath = process.argv[2];
    if (!filePath) { console.error('ERROR: Please provide path to JSON file.'); return; }

    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for practice test upload.');
        const data = fs.readFileSync(filePath, 'utf-8');
        const testData = JSON.parse(data);
        
        // This is the FIX: The key in our JSON is 'testName', but the model expects 'name'.
        const formattedData = {
            name: testData.testName, 
            questions: testData.questions
        };

        await PracticeTest.findOneAndUpdate({ name: formattedData.name }, formattedData, { upsert: true });
        console.log(`✅ Successfully uploaded/updated practice test: "${formattedData.name}"`);
    } catch (error) {
        console.error('❌ Error during upload:', error);
    } finally {
        await mongoose.connection.close();
    }
};

uploadData();