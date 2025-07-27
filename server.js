// server.js (Version with new Coding Problem functionality)

// === 1. IMPORTS AND SETUP ===
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// === 2. MIDDLEWARE ===
const corsOptions = { origin: 'https://rahuljavaskit.online', methods: "GET,POST" };
app.use(cors(corsOptions));
app.use(express.json());

// === 3. DATABASE CONNECTION ===
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.error("MongoDB Connection Failed:", err));

// === 4. DATABASE MODELS ===

// --- Existing Models ---
const PracticeTest = mongoose.model('PracticeTest', new mongoose.Schema({ name: String, questions: [new mongoose.Schema({ question: String, options: [String], answer: String })] }));
const Exam = mongoose.model('Exam', new mongoose.Schema({ testName: String, questions: [new mongoose.Schema({ question: String, options: [String], answer: String })] }));
const TestResult = mongoose.model('TestResult', new mongoose.Schema({ studentName: String, studentId: String, testName: String, score: Number, total: Number, startTime: Date, finishTime: Date, status: String }).index({ studentId: 1, testName: 1 }, { unique: true }));

// ========== NEW MODELS FOR CODING PROBLEMS START ==========
// Blueprint for a single coding problem
const CodingProblemSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    exampleInput: { type: String, required: true },
    exampleOutput: { type: String, required: true },
    topic: { type: String, required: true, index: true } // e.g., 'Arrays', 'Strings'
});
const CodingProblem = mongoose.model('CodingProblem', CodingProblemSchema);

// Blueprint for a student's code submission
const CodeSubmissionSchema = new mongoose.Schema({
    studentId: { type: String, required: true }, // For now, we'll trust the user to enter this
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
    submittedCode: { type: String, required: true },
    submissionTime: { type: Date, default: Date.now }
});
const CodeSubmission = mongoose.model('CodeSubmission', CodeSubmissionSchema);
// ========== NEW MODELS FOR CODING PROBLEMS END ==========


// === 5. API ENDPOINTS ===

// --- Existing Endpoints (No changes needed) ---
app.get('/api/tests', async (req, res) => { /* ... existing code ... */ });
app.get('/api/test/:testName', async (req, res) => { /* ... existing code ... */ });
app.post('/api/submit/:testName', async (req, res) => { /* ... existing code ... */ });
app.post('/api/exam/start', async (req, res) => { /* ... existing code ... */ });
app.post('/api/exam/submit', async (req, res) => { /* ... existing code ... */ });
app.post('/api/compile', async (req, res) => { /* ... existing code ... */ });

// ========== NEW API ENDPOINTS FOR CODING PROBLEMS START ==========

// GET a list of all coding problems (titles and topics only)
app.get('/api/coding-problems', async (req, res) => {
    try {
        const problems = await CodingProblem.find({}).select('title topic');
        res.json(problems);
    } catch (error) {
        res.status(500).json({ message: "Error fetching problem list" });
    }
});

// GET the full details of a single coding problem by its ID
app.get('/api/coding-problems/:id', async (req, res) => {
    try {
        const problem = await CodingProblem.findById(req.params.id);
        if (!problem) return res.status(404).json({ message: "Problem not found" });
        res.json(problem);
    } catch (error) {
        res.status(500).json({ message: "Error fetching problem details" });
    }
});

// POST a new code submission
app.post('/api/coding-problems/submit', async (req, res) => {
    const { studentId, problemId, submittedCode } = req.body;
    if (!studentId || !problemId || !submittedCode) {
        return res.status(400).json({ message: "Student ID, Problem ID, and Code are required." });
    }
    try {
        const submission = new CodeSubmission({ studentId, problemId, submittedCode });
        await submission.save();
        res.status(201).json({ message: "Code submitted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error saving submission" });
    }
});
// ========== NEW API ENDPOINTS FOR CODING PROBLEMS END ==========


// === 6. SERVER START ===
app.listen(PORT, () => { console.log(`✅ Server is running on port ${PORT}`); });


// (Full code for existing endpoints, collapsed for brevity)
app.get('/api/tests', async (req, res) => { try { const tests = await PracticeTest.find({}).select('name questions'); const testList = tests.map(test => ({ name: test.name, questionCount: test.questions.length })); res.json(testList); } catch (error) { res.status(500).json({ message: "Error fetching test list" }); } });
app.get('/api/test/:testName', async (req, res) => { try { const test = await PracticeTest.findOne({ name: req.params.testName }); if (!test) return res.status(404).json({ message: "Test not found" }); const questionsForStudent = test.questions.map(q => ({ id: q._id, question: q.question, options: q.options })); res.json(questionsForStudent); } catch (error) { res.status(500).json({ message: "Error fetching test" }); } });
app.post('/api/submit/:testName', async (req, res) => { try { const correctTest = await PracticeTest.findOne({ name: req.params.testName }); if (!correctTest) return res.status(404).json({ message: "Test not found" }); let score = 0; req.body.answers.forEach(ans => { const question = correctTest.questions.find(q => q._id.toString() === ans.id); if (question && question.answer === ans.answer) score++; }); res.json({ score: score, total: correctTest.questions.length }); } catch (error) { res.status(500).json({ message: "Error submitting test" }); } });
app.post('/api/exam/start', async (req, res) => { const { studentName, studentId, testName } = req.body; try { const exam = await Exam.findOne({ testName: testName }); if (!exam) return res.status(404).json({ error: "Exam not found." }); const newResult = new TestResult({ studentName, studentId, testName, total: exam.questions.length }); await newResult.save(); const questionsForStudent = exam.questions.map(q => ({ id: q._id, question: q.question, options: q.options })); res.json({ questions: questionsForStudent, startTime: newResult.startTime }); } catch (error) { if (error.code === 11000) return res.status(403).json({ error: "You have already started this test." }); res.status(500).json({ error: "Server error starting test." }); } });
app.post('/api/exam/submit', async (req, res) => { const { studentId, testName, answers } = req.body; try { const result = await TestResult.findOne({ studentId, testName }); if (!result || result.status === 'finished') return res.status(403).json({ error: "Test already submitted." }); const exam = await Exam.findOne({ testName }); let score = 0; answers.forEach(ans => { const question = exam.questions.find(q => q._id.toString() === ans.id); if (question && question.answer === ans.answer) score++; }); result.score = score; result.status = 'finished'; result.finishTime = new Date(); await result.save(); res.json({ message: "Submitted successfully!", score: result.score, total: result.total }); } catch (error) { res.status(500).json({ error: "Server error submitting test." }); } });
app.post('/api/compile', async (req, res) => { const { script, stdin } = req.body; const program = { script, stdin, language: "java", versionIndex: "4", clientId: process.env.JDOODLE_CLIENT_ID, clientSecret: process.env.JDOODLE_CLIENT_SECRET }; try { const response = await axios({ method: 'post', url: 'https://api.jdoodle.com/v1/execute', data: program }); res.json(response.data); } catch (error) { res.status(500).json({ output: "Error compiling code." }); } });