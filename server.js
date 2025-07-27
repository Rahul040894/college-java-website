// server.js (Final, Cleaned, Production-Ready Version)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// === CORS Configuration ===
const corsOptions = { origin: 'https://rahuljavaskit.online', methods: "GET,POST" };
app.use(cors(corsOptions));
app.use(express.json());

// === Database Connection ===
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.error("MongoDB Connection Failed:", err));

// === DATABASE MODELS ===

// Model for the public, practice MCQ tests
const PracticeTestSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    questions: [new mongoose.Schema({ question: String, options: [String], answer: String })]
});
const PracticeTest = mongoose.model('PracticeTest', PracticeTestSchema);

// Model for the fixed, timed exam questions
const ExamSchema = new mongoose.Schema({
    testName: { type: String, required: true, unique: true },
    questions: [new mongoose.Schema({ question: String, options: [String], answer: String })]
});
const Exam = mongoose.model('Exam', ExamSchema);

// Model to store student results for the timed exam
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
TestResultSchema.index({ studentId: 1, testName: 1 }, { unique: true });
const TestResult = mongoose.model('TestResult', TestResultSchema);


// === API ENDPOINTS ===

// --- Endpoints for PUBLIC PRACTICE TESTS ---
app.get('/api/tests', async (req, res) => {
    try {
        const tests = await PracticeTest.find({}).select('name questions');
        const testList = tests.map(test => ({ name: test.name, questionCount: test.questions.length }));
        res.json(testList);
    } catch (error) { res.status(500).json({ message: "Error fetching test list" }); }
});

app.get('/api/test/:testName', async (req, res) => {
    try {
        const test = await PracticeTest.findOne({ name: req.params.testName });
        if (!test) return res.status(404).json({ message: "Test not found" });
        const questionsForStudent = test.questions.map(q => ({ id: q._id, question: q.question, options: q.options }));
        res.json(questionsForStudent);
    } catch (error) { res.status(500).json({ message: "Error fetching test" }); }
});

app.post('/api/submit/:testName', async (req, res) => {
    try {
        const correctTest = await PracticeTest.findOne({ name: req.params.testName });
        if (!correctTest) return res.status(404).json({ message: "Test not found" });
        let score = 0;
        req.body.answers.forEach(ans => {
            const question = correctTest.questions.find(q => q._id.toString() === ans.id);
            if (question && question.answer === ans.answer) score++;
        });
        res.json({ score: score, total: correctTest.questions.length });
    } catch (error) { res.status(500).json({ message: "Error submitting test" }); }
});

// --- Endpoints for TIMED FINAL EXAM ---
app.post('/api/exam/start', async (req, res) => {
    const { studentName, studentId, testName } = req.body;
    try {
        const exam = await Exam.findOne({ testName: testName });
        if (!exam) return res.status(404).json({ error: "Exam not found." });
        
        const newResult = new TestResult({ studentName, studentId, testName, total: exam.questions.length });
        await newResult.save();
        
        const questionsForStudent = exam.questions.map(q => ({ id: q._id, question: q.question, options: q.options }));
        res.json({ questions: questionsForStudent, startTime: newResult.startTime });
    } catch (error) {
        if (error.code === 11000) return res.status(403).json({ error: "You have already started this test." });
        res.status(500).json({ error: "Server error starting test." });
    }
});

app.post('/api/exam/submit', async (req, res) => {
    const { studentId, testName, answers } = req.body;
    try {
        const result = await TestResult.findOne({ studentId, testName });
        if (!result || result.status === 'finished') return res.status(403).json({ error: "Test already submitted." });
        
        const exam = await Exam.findOne({ testName });
        let score = 0;
        answers.forEach(ans => {
            const question = exam.questions.find(q => q._id.toString() === ans.id);
            if (question && question.answer === ans.answer) score++;
        });
        
        result.score = score;
        result.status = 'finished';
        result.finishTime = new Date();
        await result.save();
        res.json({ message: "Submitted successfully!", score: result.score, total: result.total });
    } catch (error) { res.status(500).json({ error: "Server error submitting test." }); }
});

// --- Endpoint for ONLINE COMPILER ---
app.post('/api/compile', async (req, res) => {
    const { script, stdin } = req.body;
    const program = { script, stdin, language: "java", versionIndex: "4", clientId: process.env.JDOODLE_CLIENT_ID, clientSecret: process.env.JDOODLE_CLIENT_SECRET };
    try {
        const response = await axios({ method: 'post', url: 'https://api.jdoodle.com/v1/execute', data: program });
        res.json(response.data);
    } catch (error) { res.status(500).json({ output: "Error compiling code." }); }
});

// === Server Start ===
app.listen(PORT, () => { console.log(`✅ Server is running on port ${PORT}`); });