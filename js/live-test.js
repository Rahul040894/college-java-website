// js/live-test.js (The Truly Final Version with Hardened Anti-Cheating)

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';
    const testName = 'final-exam-java';
    const testDurationMinutes = 60;

    // --- Element Selectors ---
    const entryForm = document.getElementById('entry-form');
    let isSubmitting = false;
    let timerInterval;

    // --- Event Listeners ---
    if (entryForm) {
        entryForm.addEventListener('submit', handleStartTest);
    }

    // --- Main Functions ---

    async function handleStartTest(e) {
        e.preventDefault();
        // ... (This function remains mostly the same)
        const studentName = document.getElementById('studentName').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        if (!studentName || !studentId) { showError("Please fill in all fields."); return; }
        const startBtn = document.getElementById('startBtn');
        startBtn.disabled = true;
        startBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Starting...`;
        try {
            const response = await fetch(`${liveServerUrl}/api/exam/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentName, studentId, testName }) });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || 'Failed to start the test.'); }
            localStorage.setItem('studentId', studentId);
            startTest(data.questions, studentName, studentId);
        } catch (error) {
            showError(error.message);
            startBtn.disabled = false;
            startBtn.innerHTML = 'Start Test';
        }
    }

    function startTest(questions, name, id) {
        const entryContainer = document.getElementById('entry-container');
        const testContainer = document.getElementById('test-container');
        const studentInfo = document.getElementById('student-info');
        
        entryContainer.classList.add('d-none');
        testContainer.classList.remove('d-none');
        studentInfo.textContent = `Student: ${name} (${id})`;
        
        // --- Activate the HARDENED "Digital Proctor" Suite ---
        activateProctoring();
        
        const shuffledQuestions = shuffleArray(questions);
        displayQuestions(shuffledQuestions);
        startTimer();
    }
    
    // --- The HARDENED "Digital Proctor" functions ---
    function handleCheatingAttempt() {
        // This is now the single point of failure
        if (!isSubmitting) { // Only show alert and submit once
            alert("You have navigated away from the test window. Your exam will now be submitted automatically to maintain academic integrity.");
            handleSubmission();
        }
    }

    function activateProctoring() {
        // Proctor 1: Detects tab switching, minimizing (can be fooled by some extensions)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) handleCheatingAttempt();
        });
        // Proctor 2: Detects when the browser window loses focus (stronger)
        window.addEventListener('blur', handleCheatingAttempt);
        // Proctor 3: Detects when the mouse leaves the page entirely (very strong)
        document.documentElement.addEventListener('mouseleave', handleCheatingAttempt);
    }

    function deactivateProctoring() {
        document.removeEventListener('visibilitychange', handleCheatingAttempt);
        window.removeEventListener('blur', handleCheatingAttempt);
        document.documentElement.removeEventListener('mouseleave', handleCheatingAttempt);
    }
    
    async function handleSubmission(e) {
        if (e) e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;
        
        // Stop all proctoring features
        clearInterval(timerInterval);
        deactivateProctoring();
        
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) { /* ... disable button ... */ }
        
        const examForm = document.getElementById('exam-form');
        examForm.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
        const answers = [];
        examForm.querySelectorAll('input[type="radio"]:checked').forEach(input => { answers.push({ id: input.name.replace('question', ''), answer: input.value }); });
        
        const studentId = localStorage.getItem('studentId');
        try {
            await fetch(`${liveServerUrl}/api/exam/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, testName, answers }) });
            const testContainer = document.getElementById('test-container');
            const completeContainer = document.getElementById('complete-container');
            testContainer.classList.add('d-none');
            completeContainer.classList.remove('d-none');
        } catch (error) {
            alert('There was an error submitting your test. Please contact your instructor.');
        }
    }

    // --- Other functions (displayQuestions, startTimer, etc.) remain the same ---
    
    function displayQuestions(questions) {
        const examForm = document.getElementById('exam-form');
        examForm.innerHTML = '';
        questions.forEach((q, index) => { /* ... create and append question elements ... */ });
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.id = 'submitBtn';
        submitButton.className = 'btn btn-success btn-lg mt-3';
        submitButton.textContent = 'Finish & Submit Test';
        examForm.appendChild(submitButton);
        examForm.addEventListener('submit', handleSubmission);
    }
    
    function startTimer() {
        let timeLeft = testDurationMinutes * 60;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = `Time Left: ${testDurationMinutes}:00`;
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            seconds = seconds < 10 ? '0' + seconds : seconds;
            if (timerElement) timerElement.textContent = `Time Left: ${minutes}:${seconds}`;
            if (timeLeft <= 0) {
                if (timerElement) { timerElement.textContent = 'Time Up!'; /* ... */ }
                handleSubmission();
            }
        }, 1000);
    }

    function showError(message) { /* ... */ }
    function shuffleArray(array) { /* ... */ return array; } // Collapsed for brevity

    // Helper functions for readability (full code in the final block below)
});


// =========================================================================
// === COMPLETE SCRIPT FOR COPY-PASTE (to avoid errors) ===
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';
    const testName = 'final-exam-java';
    const testDurationMinutes = 60;
    const entryForm = document.getElementById('entry-form');
    let isSubmitting = false;
    let timerInterval;
    if (entryForm) { entryForm.addEventListener('submit', handleStartTest); }
    async function handleStartTest(e) {
        e.preventDefault();
        const studentName = document.getElementById('studentName').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        if (!studentName || !studentId) { showError("Please fill in all fields."); return; }
        const startBtn = document.getElementById('startBtn');
        startBtn.disabled = true;
        startBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Starting...`;
        try {
            const response = await fetch(`${liveServerUrl}/api/exam/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentName, studentId, testName }) });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || 'Failed to start the test.'); }
            localStorage.setItem('studentId', studentId);
            startTest(data.questions, studentName, studentId);
        } catch (error) {
            showError(error.message);
            startBtn.disabled = false;
            startBtn.innerHTML = 'Start Test';
        }
    }
    function startTest(questions, name, id) {
        const entryContainer = document.getElementById('entry-container');
        const testContainer = document.getElementById('test-container');
        const studentInfo = document.getElementById('student-info');
        entryContainer.classList.add('d-none');
        testContainer.classList.remove('d-none');
        studentInfo.textContent = `Student: ${name} (${id})`;
        activateProctoring();
        const shuffledQuestions = shuffleArray(questions);
        displayQuestions(shuffledQuestions);
        startTimer();
    }
    function handleCheatingAttempt() {
        if (!isSubmitting) {
            alert("You have navigated away from the test window. Your exam will now be submitted automatically to maintain academic integrity.");
            handleSubmission();
        }
    }
    function activateProctoring() {
        document.addEventListener('visibilitychange', () => { if (document.hidden) handleCheatingAttempt(); });
        window.addEventListener('blur', handleCheatingAttempt);
        document.documentElement.addEventListener('mouseleave', handleCheatingAttempt);
    }
    function deactivateProctoring() {
        document.removeEventListener('visibilitychange', handleCheatingAttempt);
        window.removeEventListener('blur', handleCheatingAttempt);
        document.documentElement.removeEventListener('mouseleave', handleCheatingAttempt);
    }
    async function handleSubmission(e) {
        if (e) e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;
        clearInterval(timerInterval);
        deactivateProctoring();
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Submitting...`; }
        const examForm = document.getElementById('exam-form');
        examForm.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
        const answers = [];
        examForm.querySelectorAll('input[type="radio"]:checked').forEach(input => { answers.push({ id: input.name.replace('question', ''), answer: input.value }); });
        const studentId = localStorage.getItem('studentId');
        try {
            await fetch(`${liveServerUrl}/api/exam/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, testName, answers }) });
            const testContainer = document.getElementById('test-container');
            const completeContainer = document.getElementById('complete-container');
            testContainer.classList.add('d-none');
            completeContainer.classList.remove('d-none');
        } catch (error) {
            alert('There was an error submitting your test. Please contact your instructor.');
        }
    }
    function displayQuestions(questions) {
        const examForm = document.getElementById('exam-form');
        examForm.innerHTML = '';
        questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'mb-4';
            let optionsHTML = q.options.map(option => `<div class="form-check"><input class="form-check-input" type="radio" name="question${q.id}" value="${option}" required><label class="form-check-label">${option}</label></div>`).join('');
            questionElement.innerHTML = `<h5>${index + 1}. ${q.question.replace(/\n/g, '<br>')}</h5>${optionsHTML}`;
            examForm.appendChild(questionElement);
        });
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.id = 'submitBtn';
        submitButton.className = 'btn btn-success btn-lg mt-3';
        submitButton.textContent = 'Finish & Submit Test';
        examForm.appendChild(submitButton);
        examForm.addEventListener('submit', handleSubmission);
    }
    function startTimer() {
        let timeLeft = testDurationMinutes * 60;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = `Time Left: ${testDurationMinutes}:00`;
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            seconds = seconds < 10 ? '0' + seconds : seconds;
            if (timerElement) timerElement.textContent = `Time Left: ${minutes}:${seconds}`;
            if (timeLeft <= 0) {
                if (timerElement) { timerElement.textContent = 'Time Up!'; timerElement.classList.remove('bg-danger'); timerElement.classList.add('bg-warning'); }
                handleSubmission();
            }
        }, 1000);
    }
    function showError(message) {
        const entryError = document.getElementById('entry-error');
        entryError.textContent = message;
        entryError.classList.remove('d-none');
    }
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});