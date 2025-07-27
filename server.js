// server.js (Final Version for Timed Exam)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// === CORS Configuration ===
const corsOptions = { origin: 'https://rahuljavaskit.online', methods: "GET,POST", };
app.use(cors(corsOptions));
app.use(express.json());

// === Database Connection ===
mongoose.connect(process.env.DATABASE_URL).then(() => console.log("✅ MongoDB Connected")).catch(err => console.error("MongoDB Connection Failed:", err));

// === EXISTING MODELS for the public part of the site ===
const TestSchema = new mongoose.Schema({ name: { type: String, required: true, unique: true }, questions: [new mongoose.Schema({ question: String, options: [String], answer: String })] });
const Test = mongoose.model('Test', TestSchema);

// === NEW MODELS for the timed exam ===
const ExamSchema = new mongoose.Schema({ testName: String, questions: [new mongoose.Schema({ question: String, options: [String], answer: String })] });
const Exam = mongoose.model('Exam', ExamSchema);

const TestResultSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    studentId: { type: String, required: true },
    testName: { type: String, required: true },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    startTime: { type: Date, default: Date.now },
    finishTime: { type: Date },
    status: { type: String, enum: ['started', 'finished'], default: 'started' }
});
TestResultSchema.index({ studentId: 1, testName: 1 }, { unique: true }); // Prevent retakes
const TestResult = mongoose.model('TestResult', TestResultSchema);


// === EXISTING API ENDPOINTS (No changes) ===
app.get('/api/tests', async (req, res) => { /* ... existing code ... */ });
app.get('/api/test/:testName', async (req, res) => { /* ... existing code ... */ });
app.post('/api/submit/:testName', async (req, res) => { /* ... existing code ... */ });
app.post('/api/compile', async (req, res) => { /* ... existing code ... */ });


// === NEW API ENDPOINTS for the timed exam ===

// Endpoint to start the test
app.post('/api/exam/start', async (req, res) => {
    const { studentName, studentId, testName } = req.body;
    if (!studentName || !studentId || !testName) {
        return res.status(400).json({ error: "Name, ID, and Test Name are required." });
    }
    try {
        const existingResult = await TestResult.findOne({ studentId, testName });
        if (existingResult) {
            return res.status(403).json({ error: "You have already attempted this test." });
        }
        
        const exam = await Exam.findOne({ testName: testName });
        if (!exam) {
            return res.status(404).json({ error: "Exam not found." });
        }
        
        const newResult = new TestResult({ studentName, studentId, testName, total: exam.questions.length });
        await newResult.save();
        
        const questionsForStudent = exam.questions.map(q => ({ id: q._id, question: q.question, options: q.options }));
        res.json({ questions: questionsForStudent, startTime: newResult.startTime });

    } catch (error) {
        if (error.code === 11000) { // Duplicate key error code
            return res.status(403).json({ error: "You have already started this test." });
        }
        res.status(500).json({ error: "Server error while starting the test." });
    }
});

// Endpoint to submit the test
app.post('/api/exam/submit', async (req, res) => {
    const { studentId, testName, answers } = req.body;
    try {
        const result = await TestResult.findOne({ studentId, testName });
        if (!result || result.status === 'finished') {
            return res.status(403).json({ error: "Test already submitted or not found." });
        }
        
        const exam = await Exam.findOne({ testName });
        let score = 0;
        answers.forEach(studentAnswer => {
            const question = exam.questions.find(q => q._id.toString() === studentAnswer.id);
            if (question && question.answer === studentAnswer.answer) {
                score++;
            }
        });
        
        result.score = score;
        result.status = 'finished';
        result.finishTime = new Date();
        await result.save();
        
        res.json({ message: "Test submitted successfully!", score: result.score, total: result.total });
    } catch (error) {
        res.status(500).json({ error: "Server error while submitting the test." });
    }
});


// === Server Start ===
app.listen(PORT, () => { console.log(`✅ Back-end server is running on http://localhost:${PORT}`); });

// (I have collapsed the existing API endpoint functions for brevity, but they should remain in your file)
// === Full code for existing endpoints needed for the rest of the site ===
app.get('/api/tests', async (req, res) => { try { const tests = await Test.find({}).select('name questions'); const testList = tests.map(test => ({ name: test.name, questionCount: test.questions.length })); res.json(testList); } catch (error) { res.status(500).json({ message: "Error fetching test list", error: error.message }); } });
app.get('/api/test/:testName', async (req, res) => { try { const test = await Test.findOne({ name: req.params.testName }); if (!test) return res.status(404).json({ message: "Test not found" }); const questionsForStudent = test.questions.map(q => ({ id: q._id, question: q.question, options: q.options })); res.json(questionsForStudent); } catch (error) { res.status(500).json({ message: "Error fetching test", error: error.message }); } });
app.post('/api/submit/:testName', async (req, res) => { try { const correctTest = await Test.findOne({ name: req.params.testName }); if (!correctTest) return res.status(404).json({ message: "Test not found" }); let score = 0; req.body.answers.forEach(studentAnswer => { const question = correctTest.questions.find(q => q._id.toString() === studentAnswer.id); if (question && question.answer === studentAnswer.answer) { score++; } }); res.json({ score: score, total: correctTest.questions.length }); } catch (error) { res.status(500).json({ message: "Error submitting test", error: error.message }); } });
app.post('/api/compile', async (req, res) => { const { script, stdin } = req.body; const program = { script, stdin, language: "java", versionIndex: "4", clientId: process.env.JDOODLE_CLIENT_ID, clientSecret: process.env.JDOODLE_CLIENT_SECRET }; try { const response = await axios({ method: 'post', url: 'https://api.jdoodle.com/v1/execute', data: program }); res.json(response.data); } catch (error) { res.status(500).json({ output: "Error compiling code.", statusCode: 500 }); } });