// js/live-test.js (The Truly Final Version with All Features)

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';
    const testName = 'final-exam-java';
    const testDurationMinutes = 60;

    // --- Element Selectors ---
    const entryContainer = document.getElementById('entry-container');
    const testContainer = document.getElementById('test-container');
    const completeContainer = document.getElementById('complete-container');
    const entryForm = document.getElementById('entry-form');
    const startBtn = document.getElementById('startBtn');
    const entryError = document.getElementById('entry-error');
    const studentInfo = document.getElementById('student-info');
    const examForm = document.getElementById('exam-form');
    let timerInterval;
    
    // --- A flag to prevent multiple submissions ---
    let isSubmitting = false;

    // --- Event Listeners ---
    if (entryForm) {
        entryForm.addEventListener('submit', handleStartTest);
    }

    // --- Main Functions ---

    async function handleStartTest(e) {
        e.preventDefault();
        const studentNameInput = document.getElementById('studentName');
        const studentIdInput = document.getElementById('studentId');
        const studentName = studentNameInput.value.trim();
        const studentId = studentIdInput.value.trim();
        
        if (!studentName || !studentId) { showError("Please fill in all fields."); return; }

        startBtn.disabled = true;
        startBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Starting...`;
        
        try {
            const response = await fetch(`${liveServerUrl}/api/exam/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentName, studentId, testName })
            });
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
        entryContainer.classList.add('d-none');
        testContainer.classList.remove('d-none');
        studentInfo.textContent = `Student: ${name} (${id})`;
        
        // --- Activate the "Digital Proctor" ---
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        const shuffledQuestions = shuffleArray(questions);
        displayQuestions(shuffledQuestions);
        startTimer();
    }
    
    // --- The "Digital Proctor" function ---
    function handleVisibilityChange() {
        if (document.hidden) {
            alert("You have navigated away from the test tab. Your exam will now be submitted automatically.");
            handleSubmission(); // Trigger the auto-submission
        }
    }
    
    async function handleSubmission(e) {
        if (e) e.preventDefault();
        
        if (isSubmitting) return; // Prevent double submissions
        isSubmitting = true;
        
        // Stop the timer and remove the visibility checker to prevent it from firing again
        clearInterval(timerInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Submitting...`;
        }
        
        examForm.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);

        const answers = [];
        examForm.querySelectorAll('input[type="radio"]:checked').forEach(input => {
            answers.push({ id: input.name.replace('question', ''), answer: input.value });
        });
        
        const studentId = localStorage.getItem('studentId');
        
        try {
            await fetch(`${liveServerUrl}/api/exam/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, testName, answers })
            });
            testContainer.classList.add('d-none');
            completeContainer.classList.remove('d-none');
        } catch (error) {
            alert('There was an error submitting your test. Please contact your instructor.');
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
        timerElement.textContent = `Time Left: ${testDurationMinutes}:00`;

        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            seconds = seconds < 10 ? '0' + seconds : seconds;
            
            if (timerElement) {
                timerElement.textContent = `Time Left: ${minutes}:${seconds}`;
            }
            
            if (timeLeft <= 0) {
                if (timerElement) {
                    timerElement.textContent = 'Time Up!';
                    timerElement.classList.remove('bg-danger');
                    timerElement.classList.add('bg-warning');
                }
                handleSubmission();
            }
        }, 1000);
    }

    function showError(message) {
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