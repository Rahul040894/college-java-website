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
        
        await PracticeTest.findOneAndUpdate({ name: testData.name }, testData, { upsert: true });
        console.log(`✅ Successfully uploaded/updated practice test: "${testData.name}"`);
    } catch (error) {
        console.error('❌ Error during upload:', error);
    } finally {
        await mongoose.connection.close();
    }
};
uploadData();