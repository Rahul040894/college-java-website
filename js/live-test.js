document.addEventListener('DOMContentLoaded', () => {
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';
    const testName = 'Assignment-1-100-questions'; // Ensure this is the correct test name
    const testDurationMinutes = 10; // Ensure this is the correct duration
    const entryContainer = document.getElementById('entry-container');
    const testContainer = document.getElementById('test-container');
    const completeContainer = document.getElementById('complete-container');
    const entryForm = document.getElementById('entry-form');
    const startBtn = document.getElementById('startBtn');
    const entryError = document.getElementById('entry-error');
    const studentInfo = document.getElementById('student-info');
    const examForm = document.getElementById('exam-form');
    let timerInterval;
    let isSubmitting = false;
    // --- NEW VARIABLE for the warning timer ---
    let warningTimer = null; 

    if (entryForm) {
        entryForm.addEventListener('submit', handleStartTest);
    }

    async function handleStartTest(e) {
        e.preventDefault();
        const studentName = document.getElementById('studentName').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        if (!studentName || !studentId) { showError("Please fill in all fields."); return; }
        startBtn.disabled = true;
        startBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Starting...`;
        try {
            const response = await fetch(`${liveServerUrl}/api/exam/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentName, studentId, testName }) });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || 'Failed to start test.'); }
            localStorage.setItem('studentId', studentId);
            startTest(data.questions, studentName, studentId);
        } catch (error) {
            showError(error.message);
            startBtn.disabled = false;
            startBtn.innerHTML = 'Start Test';
        }
    }

    function startTest(questions, name, id) {
        entryContainer.classList.add('d-none');
        testContainer.classList.remove('d-none');
        studentInfo.textContent = `Student: ${name} (${id})`;
        activateProctoring();
        displayQuestions(questions); // Using the non-shuffled, 10-question logic
        startTimer();
    }
    
    // --- NEW PROCTORING LOGIC ---
    function handleFocusLoss() {
        if (isSubmitting || warningTimer) return; // Don't trigger if already submitting or a warning is active

        alert("WARNING: You have navigated away from the assessment window. Return immediately.\n\nYour test will be automatically submitted in 5 seconds.");
        
        warningTimer = setTimeout(() => {
            console.log("Grace period expired. Submitting test.");
            handleSubmission();
        }, 5000); // 5-second grace period
    }

    function handleFocusReturn() {
        if (warningTimer) {
            clearTimeout(warningTimer);
            warningTimer = null;
            console.log("Returned within grace period. Submission cancelled.");
        }
    }
    
    function activateProctoring() {
        // Main listener for tab switching and minimizing
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                handleFocusLoss();
            } else {
                handleFocusReturn();
            }
        });
        
        // Removed 'mouseleave' listener for cursor control
        
        // Listeners for copy/paste etc. remain the same
        document.addEventListener('copy', handleDisabledAction);
        document.addEventListener('paste', handleDisabledAction);
        document.addEventListener('cut', handleDisabledAction);
        document.addEventListener('contextmenu', handleDisabledAction);
    }
    
    function handleDisabledAction(event) {
        event.preventDefault();
        alert("Copying, pasting, and right-clicking are disabled to ensure the integrity of the assessment.");
    }
    // --- END OF NEW PROCTORING LOGIC ---
    
    async function handleSubmission(e) {
        if (e) e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;
        
        // Deactivate all timers and listeners
        clearInterval(timerInterval);
        clearTimeout(warningTimer);
        document.removeEventListener('visibilitychange', handleFocusLoss); // Clean up listener
        
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Submitting...`; }
        
        examForm.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
        const answers = [];
        examForm.querySelectorAll('input[type="radio"]:checked').forEach(input => { answers.push({ id: input.name.replace('question', ''), answer: input.value }); });
        
        const studentId = localStorage.getItem('studentId');
        try {
            await fetch(`${liveServerUrl}/api/exam/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, testName, answers }) });
            testContainer.classList.add('d-none');
            completeContainer.classList.remove('d-none');
        } catch (error) {
            alert('Error submitting your test. Contact your instructor.');
        }
    }
    
    function displayQuestions(questions) {
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
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            seconds = seconds < 10 ? '0' + seconds : seconds;
            if (timerElement) { timerElement.textContent = `Time Left: ${minutes}:${seconds}`; }
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
});