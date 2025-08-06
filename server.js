// server.js (The Truly Final, Fully-Secured Production Version)

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

// === ALL DATABASE MODELS ===
const PracticeTest = mongoose.model('PracticeTest', new mongoose.Schema({ name: { type: String, required: true, unique: true }, questions: [new mongoose.Schema({ question: String, options: [String], answer: String }, { _id: true })] }));
const Exam = mongoose.model('Exam', new mongoose.Schema({ testName: { type: String, required: true, unique: true }, questions: [new mongoose.Schema({ question: String, options: [String], answer: String }, { _id: true })] }));
const TestResult = mongoose.model('TestResult', new mongoose.Schema({ studentName: String, studentId: String, testName: String, score: Number, total: Number, startTime: Date, finishTime: Date, status: String }).index({ studentId: 1, testName: 1 }, { unique: true }));
const AllowedUsn = mongoose.model('AllowedUsn', new mongoose.Schema({ usn: { type: String, required: true, unique: true } }));
const CodingProblem = mongoose.model('CodingProblem', new mongoose.Schema({ title: String, description: String, exampleInput: String, exampleOutput: String, topic: String }));
const CodeSubmission = mongoose.model('CodeSubmission', new mongoose.Schema({ studentId: String, problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' }, submittedCode: String, submissionTime: { type: Date, default: Date.now } }));


// === ALL API ENDPOINTS ===

// ... (All other API endpoints for practice tests, compiler, coding problems remain the same)

// --- Endpoints for TIMED FINAL EXAM (WITH ALL SECURITY CHECKS RESTORED) ---
app.post('/api/exam/start', async (req, res) => {
    const { studentName, studentId, testName } = req.body;
    try {
        // --- SECURITY CHECK 1: Is this USN on the guest list? ---
        const usnRegex = new RegExp(`^${studentId}$`, 'i');
        const isAllowed = await AllowedUsn.findOne({ usn: usnRegex });
        if (!isAllowed) {
            return res.status(403).json({ error: "This USN is not authorized to take the exam." });
        }
        
        // --- SECURITY CHECK 2 (RESTORED): Has this USN already started the test? ---
        const existingResult = await TestResult.findOne({ studentId: usnRegex, testName });
        if (existingResult) {
            return res.status(403).json({ error: "This USN has already attempted this test. Multiple attempts are not allowed." });
        }
        // --- END OF SECURITY CHECKS ---

        const exam = await Exam.findOne({ testName: testName });
        if (!exam) return res.status(404).json({ error: "The exam is not available at this time." });
        
        const authorizedUsn = isAllowed.usn;
        
        const newResult = new TestResult({ studentName, studentId: authorizedUsn, testName, total: exam.questions.length });
        await newResult.save();
        
        const questionsForStudent = exam.questions.map(q => ({ id: q._id, question: q.question, options: q.options }));
        res.json({ questions: questionsForStudent, startTime: newResult.startTime });
    } catch (error) {
        // The unique index on TestResult will also catch race conditions as a final backstop.
        if (error.code === 11000) return res.status(403).json({ error: "This USN has already started the test." });
        console.error("Error in /api/exam/start:", error);
        res.status(500).json({ error: "A server error occurred. Please try again." });
    }
});

// ... (The rest of your API endpoints)
// (Full code for other endpoints is collapsed here for brevity but should remain in your file)
app.get('/api/tests', async (req, res) => { try { const tests = await PracticeTest.find({}).select('name questions'); res.json(tests.map(test => ({ name: test.name, questionCount: test.questions.length }))); } catch (error) { res.status(500).json({ message: "Error fetching practice tests" }); } });
app.get('/api/test/:testName', async (req, res) => { try { const test = await PracticeTest.findOne({ name: req.params.testName }); if (!test) return res.status(404).json({ message: "Practice test not found" }); res.json(test.questions.map(q => ({ id: q._id, question: q.question, options: q.options }))); } catch (error) { res.status(500).json({ message: "Error fetching practice test" }); } });
app.post('/api/submit/:testName', async (req, res) => { try { const correctTest = await PracticeTest.findOne({ name: req.params.testName }); if (!correctTest) return res.status(404).json({ message: "Practice test not found" }); let score = 0; req.body.answers.forEach(ans => { const q = correctTest.questions.find(q => q._id.toString() === ans.id); if (q && q.answer === ans.answer) score++; }); res.json({ score: score, total: correctTest.questions.length }); } catch (error) { res.status(500).json({ message: "Error submitting practice test" }); } });
app.post('/api/exam/submit', async (req, res) => { const { studentId, testName, answers } = req.body; try { const usnRegex = new RegExp(`^${studentId}$`, 'i'); const result = await TestResult.findOne({ studentId: usnRegex, testName }); if (!result || result.status === 'finished') return res.status(403).json({ error: "Test already submitted." }); const exam = await Exam.findOne({ testName }); let score = 0; answers.forEach(ans => { const q = exam.questions.find(q => q._id.toString() === ans.id); if (q && q.answer === ans.answer) score++; }); result.score = score; result.status = 'finished'; result.finishTime = new Date(); await result.save(); res.json({ message: "Submitted successfully!", score: result.score, total: result.total }); } catch (error) { res.status(500).json({ error: "Server error submitting test." }); } });
app.get('/api/coding-problems', async (req, res) => { try { const problems = await CodingProblem.find({}).select('title topic'); res.json(problems); } catch (error) { res.status(500).json({ message: "Error fetching problem list" }); } });
app.get('/api/coding-problems/:id', async (req, res) => { try { const problem = await CodingProblem.findById(req.params.id); if (!problem) return res.status(404).json({ message: "Problem not found" }); res.json(problem); } catch (error) { res.status(500).json({ message: "Error fetching problem details" }); } });
app.post('/api/coding-problems/submit', async (req, res) => { const { studentId, problemId, submittedCode } = req.body; if (!studentId || !problemId || !submittedCode) return res.status(400).json({ message: "All fields are required." }); try { const submission = new CodeSubmission({ studentId, problemId, submittedCode }); await submission.save(); res.status(201).json({ message: "Code submitted successfully!" }); } catch (error) { res.status(500).json({ message: "Error saving submission" }); } });
app.post('/api/compile', async (req, res) => { const { script, stdin } = req.body; const program = { script, stdin, language: "java", versionIndex: "4", clientId: process.env.JDOODLE_CLIENT_ID, clientSecret: process.env.JDOODLE_CLIENT_SECRET }; try { const response = await axios({ method: 'post', url: 'https://api.jdoodle.com/v1/execute', data: program }); res.json(response.data); } catch (error) { res.status(500).json({ output: "Error compiling code." }); } });

// === Server Start ===
app.listen(PORT, () => { console.log(`✅ Server is running on port ${PORT}`); });