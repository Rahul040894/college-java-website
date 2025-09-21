// server.js (The Truly Final, Streamlined, and Secure Production Version)

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
mongoose.connect(process.env.DATABASE_URL).then(() => console.log("✅ MongoDB Connected")).catch(err => console.error("MongoDB Connection Failed:", err));

// === ALL DATABASE MODELS (PracticeTest model is now removed) ===
const Exam = mongoose.model('Exam', new mongoose.Schema({ testName: String, questions: [new mongoose.Schema({ question: String, options: [String], answer: String }, { _id: true })] }));
const TestResult = mongoose.model('TestResult', new mongoose.Schema({ studentName: String, studentId: String, testName: String, score: Number, total: Number, startTime: Date, finishTime: Date, status: String }).index({ studentId: 1, testName: 1 }, { unique: true }));
const AllowedUsn = mongoose.model('AllowedUsn', new mongoose.Schema({ usn: { type: String, required: true, unique: true } }));
const CodingProblem = mongoose.model('CodingProblem', new mongoose.Schema({ title: String, description: String, exampleInput: String, exampleOutput: String, topic: String }));
const CodeSubmission = mongoose.model('CodeSubmission', new mongoose.Schema({ studentId: String, problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' }, submittedCode: String, submissionTime: { type: Date, default: Date.now } }).index({ studentId: 1, problemId: 1 }, { unique: true }));

// === ALL API ENDPOINTS ===

// --- Feature Flag Endpoint ---
app.get('/api/exam/status', (req, res) => { res.json({ isLive: process.env.EXAM_LIVE === 'true' }); });

// --- USN Validation Endpoint ---
app.post('/api/validate-usn', async (req, res) => {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ valid: false, message: 'USN is required.' });
    try {
        const usnRegex = new RegExp(`^${studentId}$`, 'i');
        const isAllowed = await AllowedUsn.findOne({ usn: usnRegex });
        if (isAllowed) {
            res.json({ valid: true, usn: isAllowed.usn });
        } else {
            res.json({ valid: false, message: 'This USN is not authorized.' });
        }
    } catch (error) {
        res.status(500).json({ valid: false, message: 'Server error during validation.' });
    }
});

// --- Timed Final Exam Endpoints ---
app.post('/api/exam/start', async (req, res) => { const { studentName, studentId, testName } = req.body; try { const usnRegex = new RegExp(`^${studentId}$`, 'i'); const isAllowed = await AllowedUsn.findOne({ usn: usnRegex }); if (!isAllowed) { return res.status(403).json({ error: "This USN is not authorized." }); } const existingResult = await TestResult.findOne({ studentId: usnRegex, testName }); if (existingResult) { return res.status(403).json({ error: "This USN has already attempted this test." }); } const exam = await Exam.findOne({ testName }); if (!exam) return res.status(404).json({ error: "Exam not available." }); const authorizedUsn = isAllowed.usn; const newResult = new TestResult({ studentName, studentId: authorizedUsn, testName, total: exam.questions.length }); await newResult.save(); res.json({ questions: exam.questions.map(q => ({ id: q._id, question: q.question, options: q.options })), startTime: newResult.startTime }); } catch (error) { if (error.code === 11000) return res.status(403).json({ error: "This USN has already started the test." }); res.status(500).json({ error: "Server error starting test." }); } });
app.post('/api/exam/submit', async (req, res) => { const { studentId, testName, answers } = req.body; try { const usnRegex = new RegExp(`^${studentId}$`, 'i'); const result = await TestResult.findOne({ studentId: usnRegex, testName }); if (!result || result.status === 'finished') return res.status(403).json({ error: "Test already submitted." }); const exam = await Exam.findOne({ testName }); let score = 0; answers.forEach(ans => { const q = exam.questions.find(q => q._id.toString() === ans.id); if (q && q.answer === ans.answer) score++; }); result.score = score; result.status = 'finished'; result.finishTime = new Date(); await result.save(); res.json({ message: "Submitted successfully!", score: result.score, total: result.total }); } catch (error) { res.status(500).json({ error: "Server error submitting test." }); } });

// --- Coding Problems Endpoints ---
app.get('/api/coding-problems', async (req, res) => { try { const problems = await CodingProblem.find({}).select('title topic'); res.json(problems); } catch (error) { res.status(500).json({ message: "Error fetching problem list" }); } });
app.get('/api/coding-problems/:id', async (req, res) => { try { const problem = await CodingProblem.findById(req.params.id); if (!problem) return res.status(404).json({ message: "Problem not found" }); res.json(problem); } catch (error) { res.status(500).json({ message: "Error fetching problem details" }); } });
app.post('/api/coding-problems/submit', async (req, res) => { const { studentId, problemId, submittedCode } = req.body; if (!studentId || !problemId || !submittedCode) return res.status(400).json({ message: "All fields are required." }); try { const existingSubmission = await CodeSubmission.findOne({ studentId, problemId }); if (existingSubmission) { return res.status(403).json({ message: "You have already submitted a solution for this problem." }); } const submission = new CodeSubmission({ studentId, problemId, submittedCode }); await submission.save(); res.status(201).json({ message: "Code submitted successfully!" }); } catch (error) { if (error.code === 11000) { return res.status(403).json({ message: "You have already submitted a solution for this problem." }); } res.status(500).json({ message: "Error saving submission" }); } });

// --- Online Compiler Endpoint ---
app.post('/api/compile', async (req, res) => { const { script, stdin } = req.body; const program = { script, stdin, language: "java", versionIndex: "4", clientId: process.env.JDOODLE_CLIENT_ID, clientSecret: process.env.JDOODLE_CLIENT_SECRET }; try { const response = await axios({ method: 'post', url: 'https://api.jdoodle.com/v1/execute', data: program }); res.json(response.data); } catch (error) { res.status(500).json({ output: "Error compiling code." }); } });

// === Server Start ===
app.listen(PORT, () => { console.log(`✅ Server is running on port ${PORT}`); });