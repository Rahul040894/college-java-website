// server.js (Final Version with Compiler Proxy)

// === 1. IMPORTS AND SETUP ===
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios'); // For making HTTP requests to JDoodle
require('dotenv').config(); // To load variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// === 2. MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === 3. DATABASE CONNECTION ===
mongoose.connect(process.env.DATABASE_URL)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully!");
        seedDatabase();
    })
    .catch(err => console.error("MongoDB Connection Failed:", err));

// === 4. MONGOOSE SCHEMA AND MODEL ===
const TestSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    questions: [new mongoose.Schema({
        question: { type: String, required: true },
        options: { type: [String], required: true },
        answer: { type: String, required: true }
    })]
});
const Test = mongoose.model('Test', TestSchema);

// === 5. API ENDPOINTS ===

// --- Test Listing Endpoint ---
app.get('/api/tests', async (req, res) => {
    try {
        const tests = await Test.find({}).select('name questions');
        const testList = tests.map(test => ({
            name: test.name,
            questionCount: test.questions.length
        }));
        res.json(testList);
    } catch (error) {
        res.status(500).json({ message: "Error fetching test list", error: error.message });
    }
});

// --- Get Questions for a Specific Test ---
app.get('/api/test/:testName', async (req, res) => {
    try {
        const test = await Test.findOne({ name: req.params.testName });
        if (!test) return res.status(404).json({ message: "Test not found" });
        const questionsForStudent = test.questions.map(q => ({
            id: q._id,
            question: q.question,
            options: q.options
        }));
        res.json(questionsForStudent);
    } catch (error) {
        res.status(500).json({ message: "Error fetching test", error: error.message });
    }
});

// --- Submit Answers for a Test ---
app.post('/api/submit/:testName', async (req, res) => {
    try {
        const correctTest = await Test.findOne({ name: req.params.testName });
        if (!correctTest) return res.status(404).json({ message: "Test not found" });
        
        const studentAnswers = req.body.answers;
        let score = 0;
        studentAnswers.forEach(studentAnswer => {
            const question = correctTest.questions.find(q => q._id.toString() === studentAnswer.id);
            if (question && question.answer === studentAnswer.answer) {
                score++;
            }
        });
        res.json({
            message: "Test submitted successfully!",
            score: score,
            total: correctTest.questions.length
        });
    } catch (error) {
        res.status(500).json({ message: "Error submitting test", error: error.message });
    }
});

// --- NEW: Compiler Proxy Endpoint ---
app.post('/api/compile', async (req, res) => {
    const { script } = req.body; // Only need the script from the user
    const program = {
        script: script,
        language: "java",
        versionIndex: "4", // Corresponds to JDK 17
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET
    };
    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.jdoodle.com/v1/execute',
            data: program
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error with JDoodle API:", error.response ? error.response.data : error.message);
        res.status(500).json({
            output: "An error occurred while trying to compile your code.",
            statusCode: 500
        });
    }
});

// === 6. SERVER START ===
app.listen(PORT, () => {
    console.log(`✅ Back-end server is running on http://localhost:${PORT}`);
});

// === 7. DATABASE SEEDING FUNCTION ===
async function seedDatabase() {
    try {
        const count = await Test.countDocuments();
        if (count > 0) {
            // console.log("Database already contains data. Seeding skipped.");
            return;
        }
        console.log("Database is empty. Seeding with initial data...");
        const javaBasicsTest = new Test({
            name: 'java-basics',
            questions: [
                { question: "Which keyword is used for inheritance in Java?", options: ["extends", "implements", "inherits", "super"], answer: "extends" }
            ]
        });
        await javaBasicsTest.save();
        console.log("🌱 'java-basics' test has been successfully seeded!");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
}