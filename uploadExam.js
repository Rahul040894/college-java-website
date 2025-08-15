const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const ExamSchema = new mongoose.Schema({
    testName: { type: String, required: true, unique: true },
    questions: [new mongoose.Schema({
        question: String,
        options: [String],
        answer: String
    })]
});
const Exam = mongoose.model('Exam', ExamSchema);

const uploadExamData = async () => {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('ERROR: Please provide the path to the JSON file for the exam.');
        console.log('Usage: node uploadExam.js <path-to-your-exam.json>');
        return;
    }

    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for exam upload.');

        const data = fs.readFileSync(filePath, 'utf-8');
        const examData = JSON.parse(data);
        await Exam.findOneAndUpdate(
            { testName: examData.testName }, 
            examData, 
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Successfully uploaded/updated exam: "${examData.testName}"`);

    } catch (error) {
        console.error('❌ Error during exam upload:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

uploadExamData();