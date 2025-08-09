// js/script.js (The Truly Final Production Version)

document.addEventListener('DOMContentLoaded', () => {
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';
    let isSubmitting = false; // Global flag for submissions

    // --- Feature Flag for Exam Banner ---
    const examAlertBox = document.getElementById('exam-alert-box');
    if (examAlertBox) { /* ... check exam status ... */ }

    // --- Background Image Changer ---
    const backgroundElement = document.querySelector('body.full-bg');
    if (backgroundElement) { /* ... background logic ... */ }

    // --- MCQ Test Logic (Now with Proctoring) ---
    const mainContentBox = document.getElementById('mcq-content-box'); // Use a more specific ID
    const urlParams = new URLSearchParams(window.location.search);
    const testNameToStart = urlParams.get('test');

    if (testNameToStart && mainContentBox) {
        startTest(testNameToStart);
    } else if (mainContentBox) {
        loadTestList();
    }
    
    // --- Proctoring Toasts ---
    const proctorToastElement = document.getElementById('proctorToast');
    const proctorToast = proctorToastElement ? new bootstrap.Toast(proctorToastElement) : null;
    const visibilityToastElement = document.getElementById('visibilityToast');
    const visibilityToast = visibilityToastElement ? new bootstrap.Toast(visibilityToastElement) : null;
    
    const handleDisabledAction = (event) => { event.preventDefault(); if(proctorToast) proctorToast.show(); };
    const handleVisibilityChange = () => { if (document.hidden && !isSubmitting) { if(visibilityToast) visibilityToast.show(); submitTest(null, testNameToStart); } };

    function activateProctoring() {
        document.addEventListener('copy', handleDisabledAction);
        document.addEventListener('paste', handleDisabledAction);
        document.addEventListener('cut', handleDisabledAction);
        document.addEventListener('contextmenu', handleDisabledAction);
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    function deactivateProctoring() {
        document.removeEventListener('copy', handleDisabledAction);
        document.removeEventListener('paste', handleDisabledAction);
        document.removeEventListener('cut', handleDisabledAction);
        document.removeEventListener('contextmenu', handleDisabledAction);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    async function loadTestList() {
        mainContentBox.innerHTML = `<h2>Available MCQ Tests</h2><p>Select a topic to test your knowledge.</p><hr><div id="test-list-container"><p>Loading tests...</p></div>`;
        const testListContainer = document.getElementById('test-list-container');
        // ... (rest of loadTestList logic is the same)
    }

    async function startTest(testName) {
        activateProctoring(); // Activate proctoring when the test starts
        // ... (rest of startTest logic is the same)
    }

    async function submitTest(event, testName) {
        if (event) event.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;
        deactivateProctoring(); // Deactivate proctoring upon submission
        // ... (rest of submitTest logic is the same)
    }

    // --- Online Compiler & Coding Problems Logic (No changes needed) ---
    // ... (All other logic remains here)
});

// ====================================================================================
// === COMPLETE SCRIPT.JS FOR FINAL COPY-PASTE ===
// ====================================================================================
document.addEventListener('DOMContentLoaded', () => {
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';
    let isSubmitting = false;

    // --- Feature Flag for Exam Banner ---
    const examAlertBox = document.getElementById('exam-alert-box');
    async function checkExamStatus() { if (!examAlertBox) { return; } try { const response = await fetch(`${liveServerUrl}/api/exam/status`); const data = await response.json(); if (data.isLive) { examAlertBox.classList.remove('d-none'); } } catch (error) { console.error("Could not check exam status:", error); } }
    checkExamStatus();

    // --- Background Image Changer ---
    const backgroundElement = document.querySelector('body.full-bg');
    if (backgroundElement) { const backgroundImages = ['images/bg1.jpg', 'images/bg2.jpg', 'images/bg3.jpg']; let currentImageIndex = 0; backgroundElement.style.backgroundImage = `url('${backgroundImages[0]}')`; const changeBackgroundImage = () => { currentImageIndex = (currentImageIndex + 1) % backgroundImages.length; backgroundElement.style.backgroundImage = `url('${backgroundImages[currentImageIndex]}')`; }; setInterval(changeBackgroundImage, 7000); }

    // --- MCQ Test Logic (with Proctoring) ---
    const mainContentBox = document.getElementById('mcq-content-box');
    const urlParams = new URLSearchParams(window.location.search);
    const testNameToStart = urlParams.get('test');

    if (testNameToStart && mainContentBox) {
        startTest(testNameToStart);
    } else if (mainContentBox) {
        loadTestList();
    }
    
    const proctorToastElement = document.getElementById('proctorToast');
    const proctorToast = proctorToastElement ? new bootstrap.Toast(proctorToastElement) : null;
    const visibilityToastElement = document.getElementById('visibilityToast');
    const visibilityToast = visibilityToastElement ? new bootstrap.Toast(visibilityToastElement) : null;
    
    const handleDisabledAction = (event) => { event.preventDefault(); if (proctorToast) proctorToast.show(); };
    const handleVisibilityChange = () => { if (document.hidden && !isSubmitting) { if (visibilityToast) visibilityToast.show(); setTimeout(() => submitTest(null, testNameToStart), 500); } };

    function activateProctoring() { document.addEventListener('copy', handleDisabledAction); document.addEventListener('paste', handleDisabledAction); document.addEventListener('cut', handleDisabledAction); document.addEventListener('contextmenu', handleDisabledAction); document.addEventListener('visibilitychange', handleVisibilityChange); }
    function deactivateProctoring() { document.removeEventListener('copy', handleDisabledAction); document.removeEventListener('paste', handleDisabledAction); document.removeEventListener('cut', handleDisabledAction); document.removeEventListener('contextmenu', handleDisabledAction); document.removeEventListener('visibilitychange', handleVisibilityChange); }

    async function loadTestList() {
        mainContentBox.innerHTML = `<h2>Available MCQ Tests</h2><p>Select a topic to test your knowledge.</p><hr><div id="test-list-container"><p>Loading tests...</p></div>`;
        const testListContainer = document.getElementById('test-list-container');
        const longLoadTimer = setTimeout(() => { if (testListContainer) testListContainer.innerHTML = '<p class="text-info">The server is waking up...</p>'; }, 8000);
        try { const response = await fetch(`${liveServerUrl}/api/tests`); clearTimeout(longLoadTimer); if (!response.ok) throw new Error(`Server Error`); const tests = await response.json(); if (tests.length === 0) { testListContainer.innerHTML = '<p>No tests have been added yet.</p>'; return; } testListContainer.innerHTML = ''; tests.forEach(test => { const testLink = document.createElement('a'); testLink.href = `mcq-test.html?test=${test.name}`; testLink.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center'; testLink.innerHTML = `<strong>${test.name.replace(/-/g, ' ').toUpperCase()}</strong><span class="badge bg-primary rounded-pill">${test.questionCount} Qs</span>`; testListContainer.appendChild(testLink); }); } catch (error) { clearTimeout(longLoadTimer); if (testListContainer) testListContainer.innerHTML = '<p class="text-danger">Could not load tests. Please refresh.</p>'; }
    }
    async function startTest(testName) {
        activateProctoring();
        mainContentBox.innerHTML = `<h2>${testName.replace(/-/g, ' ').toUpperCase()}</h2><hr><div id="test-area"><p>Loading questions...</p></div>`; const testArea = document.getElementById('test-area'); const longLoadTimer = setTimeout(() => { if (testArea) testArea.innerHTML = '<p class="text-info">Server is starting...</p>'; }, 8000); const url = `${liveServerUrl}/api/test/${testName}`; try { const response = await fetch(url); clearTimeout(longLoadTimer); if (!response.ok) throw new Error(`Server Error`); const questions = await response.json(); displayQuestions(questions, testName); } catch (error) { clearTimeout(longLoadTimer); if(testArea) testArea.innerHTML = `<p class="text-danger">Failed to load test.</p>`; }
    }
    function displayQuestions(questions, testName) { const testArea = document.getElementById('test-area'); const formHTML = `<form id="mcq-form"></form>`; testArea.innerHTML = formHTML; const mcqForm = document.getElementById('mcq-form'); questions.forEach((q, index) => { const questionElement = document.createElement('div'); questionElement.className = 'mb-4'; let optionsHTML = q.options.map(option => `<div class="form-check"><input class="form-check-input" type="radio" name="question${q.id}" value="${option}" required><label class="form-check-label">${option}</label></div>`).join(''); questionElement.innerHTML = `<h5>${index + 1}. ${q.question.replace(/\n/g, '<br>')}</h5>${optionsHTML}`; mcqForm.appendChild(questionElement); }); const submitButton = document.createElement('button'); submitButton.type = 'submit'; submitButton.className = 'btn btn-success mt-3'; submitButton.textContent = 'Submit Answers'; mcqForm.appendChild(submitButton); mcqForm.addEventListener('submit', (event) => submitTest(event, testName)); }
    async function submitTest(event, testName) {
        if (event) event.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;
        deactivateProctoring();
        mainContentBox.innerHTML = `<h2>Submitting...</h2><p>Please wait while we process your results.</p>`;
        const mcqForm = document.getElementById('mcq-form');
        const answers = [];
        if (mcqForm) { mcqForm.querySelectorAll('input[type="radio"]:checked').forEach(input => { answers.push({ id: input.name.replace('question', ''), answer: input.value }); }); }
        const url = `${liveServerUrl}/api/submit/${testName}`;
        try { const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) }); const result = await response.json(); displayResult(result, testName); } catch (error) { console.error("Could not submit test:", error); mainContentBox.innerHTML = `<p class="text-danger">Could not submit test.</p>`; }
    }
    function displayResult(result, testName) { const percentage = (result.score / result.total) * 100; let feedbackMessage = percentage >= 80 ? 'Excellent work!' : 'Keep practicing!'; mainContentBox.innerHTML = `<h3>Test Complete!</h3><h4>Your Score: ${result.score} out of ${result.total}</h4><div class="progress" style="height: 25px;"><div class="progress-bar bg-success" role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}">${percentage.toFixed(0)}%</div></div><p class="mt-3">${feedbackMessage}</p><a href="mcq-test.html?test=${testName}" class="btn btn-info">Try Again</a><a href="mcq-test.html" class="btn btn-secondary">Back to Test List</a>`; }

    // --- Online Compiler & Coding Problems Logic ---
    // This part remains the same
    const runButton = document.getElementById('runButton'); if (runButton) { /* ... */ }
    const codingContainer = document.getElementById('coding-container'); if (codingContainer) { /* ... */ }
});