// uploadExam.js
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const ExamSchema = new mongoose.Schema({
    testName: { type: String, required: true, unique: true },
    questions: [new mongoose.Schema({
        question: { type: String, required: true },
        options: { type: [String], required: true },
        answer: { type: String, required: true }
    })]
});
const Exam = mongoose.model('Exam', ExamSchema);

const uploadExamData = async () => {
    const filePath = process.argv[2];
    if (!filePath) { console.error('ERROR: Please provide the path to the JSON file.'); return; }
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for exam upload.');
        const data = fs.readFileSync(filePath, 'utf-8');
        const examData = JSON.parse(data);
        await Exam.findOneAndUpdate({ testName: examData.testName }, examData, { upsert: true, new: true });
        console.log(`✅ Successfully uploaded/updated exam: "${examData.testName}"`);
    } catch (error) { console.error('❌ Error during upload:', error); } finally { mongoose.connection.close(); }
};
uploadExamData();