// uploadExam.js
const fs = require('fs');
const path = require('path'); // Import the 'path' module
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
    // Get the exam name from the command line argument
    const testName = process.argv[2]; 

    if (!testName) {
        console.error('ERROR: Please provide the name of the exam.');
        console.log('Usage: node uploadExam.js "Your Exam Name"');
        return;
    }

    // Construct the file path dynamically
    // This assumes your JSON files are in the root directory of your project
    const fileName = `${testName}.json`;
    const filePath = path.join(__dirname, fileName);

    console.log(`Attempting to read file from: ${filePath}`); // Helpful for debugging

    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for exam upload.');

        // Check if the file exists before trying to read it
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Error: File not found at path: ${filePath}`);
            console.error('Please make sure the filename matches the test name and has a .json extension.');
            return; // Exit the function early
        }

        const data = fs.readFileSync(filePath, 'utf-8');
        const examData = JSON.parse(data);

        // Ensure the testName in the JSON file matches the expected testName
        if (examData.testName !== testName) {
            console.warn(`Warning: The test name in the JSON file ("${examData.testName}") does not match the filename ("${testName}").`);
        }
        
        await Exam.findOneAndUpdate(
            { testName: examData.testName }, 
            examData, 
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Successfully uploaded/updated exam: "${examData.testName}"`);

    } catch (error) {
        console.error('❌ Error during exam upload:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('Database connection closed.');
        }
    }
};

uploadExamData();