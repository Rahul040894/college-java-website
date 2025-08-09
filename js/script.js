// js/script.js (The Final, Refactored, and Hardened Production Version)
document.addEventListener('DOMContentLoaded', () => {
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';
    let isSubmitting = false;
    let problemTimerInterval;

    // --- Feature Flag for Exam Banner ---
    const examAlertBox = document.getElementById('exam-alert-box');
    async function checkExamStatus() { if (!examAlertBox) return; try { const response = await fetch(`${liveServerUrl}/api/exam/status`); const data = await response.json(); if (data.isLive) { examAlertBox.classList.remove('d-none'); } } catch (error) { console.error("Could not check exam status:", error); } }
    if (examAlertBox) checkExamStatus();

    // --- Background Image Changer ---
    const backgroundElement = document.querySelector('body.full-bg');
    if (backgroundElement) { const backgroundImages = ['images/bg1.jpg', 'images/bg2.jpg', 'images/bg3.jpg']; let currentImageIndex = 0; backgroundElement.style.backgroundImage = `url('${backgroundImages[0]}')`; const changeBackgroundImage = () => { currentImageIndex = (currentImageIndex + 1) % backgroundImages.length; backgroundElement.style.backgroundImage = `url('${backgroundImages[currentImageIndex]}')`; }; setInterval(changeBackgroundImage, 7000); }

    // --- Proctoring Logic ---
    const proctorToast = document.getElementById('proctorToast') ? new bootstrap.Toast(document.getElementById('proctorToast')) : null;
    const visibilityToast = document.getElementById('visibilityToast') ? new bootstrap.Toast(document.getElementById('visibilityToast')) : null;
    
    const handleDisabledAction = (event) => { event.preventDefault(); if (proctorToast) proctorToast.show(); };
    const handleCheatingAttempt = (callback) => { if (!isSubmitting) { if (visibilityToast) visibilityToast.show(); setTimeout(() => callback(), 500); } };
    
    function activateProctoring(submissionCallback) {
        document.addEventListener('copy', handleDisabledAction); document.addEventListener('paste', handleDisabledAction); document.addEventListener('cut', handleDisabledAction); document.addEventListener('contextmenu', handleDisabledAction);
        const visibilityHandler = () => { if (document.hidden) handleCheatingAttempt(submissionCallback); };
        const blurHandler = () => handleCheatingAttempt(submissionCallback);
        const mouseLeaveHandler = () => handleCheatingAttempt(submissionCallback);
        window.proctoringListeners = { visibilityHandler, blurHandler, mouseLeaveHandler };
        document.addEventListener('visibilitychange', window.proctoringListeners.visibilityHandler);
        window.addEventListener('blur', window.proctoringListeners.blurHandler);
        document.documentElement.addEventListener('mouseleave', window.proctoringListeners.mouseLeaveHandler);
    }
    function deactivateProctoring() {
        document.removeEventListener('copy', handleDisabledAction); document.removeEventListener('paste', handleDisabledAction); document.removeEventListener('cut', handleDisabledAction); document.removeEventListener('contextmenu', handleDisabledAction);
        if (window.proctoringListeners) {
            document.removeEventListener('visibilitychange', window.proctoringListeners.visibilityHandler);
            window.removeEventListener('blur', window.proctoringListeners.blurHandler);
            document.documentElement.removeEventListener('mouseleave', window.proctoringListeners.mouseLeaveHandler);
        }
    }

    // --- Online Compiler Logic ---
    const runButton = document.getElementById('runButton');
    if (runButton) {
        activateProctoring(() => {}); // Activate proctoring on compiler (no auto-submit)
        const editor = CodeMirror(document.getElementById('codeEditor'), { value: `public class MyClass {\n    public static void main(String args[]) {\n        System.out.println("Hello, World!");\n    }\n}`, mode: "text/x-java", theme: "dracula", lineNumbers: true, autoCloseBrackets: true });
        editor.setSize(null, "500px");
        const stdInput = document.getElementById('stdInput');
        const outputArea = document.getElementById('outputArea');
        runButton.addEventListener('click', async () => { const userCode = editor.getValue(); const userInput = stdInput.value; runButton.disabled = true; runButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Waking Server...`; outputArea.textContent = 'Connecting to the server...'; const longLoadTimer = setTimeout(() => { outputArea.textContent = 'Server is waking up. Please be patient...'; }, 8000); try { const response = await fetch(`${liveServerUrl}/api/compile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script: userCode, stdin: userInput }) }); clearTimeout(longLoadTimer); const result = await response.json(); if (result.error) { outputArea.textContent = result.error; } else if (result.output) { outputArea.textContent = result.output; } else { outputArea.textContent = "Execution finished, no output."; } } catch (error) { clearTimeout(longLoadTimer); outputArea.textContent = 'Could not connect. Please try again.'; } finally { runButton.disabled = false; runButton.innerHTML = `<svg xmlns="http://www.w.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg> Run Code`; } });
    }

    // --- Coding Problems Logic ---
    const codingContainer = document.getElementById('coding-container');
    if (codingContainer) { loadProblemList(); }
    async function loadProblemList() {
        isSubmitting = false; deactivateProctoring(); clearInterval(problemTimerInterval); // Cleanup
        codingContainer.innerHTML = `<h2>Coding Problems</h2><p>Select a problem to challenge yourself. Each problem has a 30-minute time limit.</p><hr><div id="problem-list"><p>Loading coding problems...</p></div>`;
        try {
            const problemListContainer = document.getElementById('problem-list');
            const response = await fetch(`${liveServerUrl}/api/coding-problems`);
            const problems = await response.json();
            if (problems.length === 0) { problemListContainer.innerHTML = '<p>No coding problems have been added yet.</p>'; return; }
            problemListContainer.innerHTML = '';
            problems.forEach(problem => {
                const problemLink = document.createElement('a');
                problemLink.href = '#';
                problemLink.className = 'list-group-item list-group-item-action';
                problemLink.innerHTML = `<strong>${problem.title}</strong><span class="badge bg-secondary rounded-pill float-end">${problem.topic}</span>`;
                problemLink.onclick = (e) => { e.preventDefault(); loadSingleProblem(problem._id); };
                problemListContainer.appendChild(problemLink);
            });
        } catch (error) { console.error('Failed to load problem list:', error); codingContainer.innerHTML = '<p class="text-danger">Could not load problems.</p>'; }
    }
    
    async function loadSingleProblem(problemId) {
        codingContainer.innerHTML = `<p>Loading problem...</p>`;
        try {
            const response = await fetch(`${liveServerUrl}/api/coding-problems/${problemId}`);
            const problem = await response.json();
            codingContainer.innerHTML = `<button id="backToListBtn" class="btn btn-sm btn-outline-secondary mb-3">&larr; Back to Problem List</button><div class="d-flex justify-content-between align-items-center"><h3>${problem.title}</h3><h4 id="problemTimer" class="badge bg-danger p-2">Time Left: 30:00</h4></div><p>${problem.description.replace(/\n/g, '<br>')}</p><hr><h5>Example:</h5><pre><strong>Input:</strong>\n${problem.exampleInput}\n\n<strong>Output:</strong>\n${problem.exampleOutput}</pre><hr><div class="row"><div class="col-lg-8"><h5>Your Solution:</h5><div id="codeEditor" class="mb-3"></div><h5>Standard Input (for testing):</h5><textarea id="stdInput" class="form-control" rows="3"></textarea></div><div class="col-lg-4"><h5>Test Output:</h5><pre id="outputArea" class="bg-dark text-white p-3 rounded" style="min-height: 300px; overflow-y: auto;"></pre></div></div><div class="mt-3"><button id="runCodeBtn" class="btn btn-success">Run Code</button> <button id="submitCodeBtn" class="btn btn-primary">Submit Final Code</button></div><div class="mt-3"><label for="studentIdInput" class="form-label">Enter Your USN Number to Submit:</label><input type="text" id="studentIdInput" class="form-control w-50"></div>`;
            
            document.getElementById('backToListBtn').onclick = loadProblemList;
            const editor = CodeMirror(document.getElementById('codeEditor'), { value: `public class Solution {\n    // Note: The class name must be 'Solution' for the code to run correctly.\n    public static void main(String args[]) {\n        // Your solution here\n    }\n}`, mode: "text/x-java", theme: "dracula", lineNumbers: true, autoCloseBrackets: true });
            editor.setSize(null, "400px");
            
            const runCodeBtn = document.getElementById('runCodeBtn');
            const submitCodeBtn = document.getElementById('submitCodeBtn');
            
            const submissionCallback = () => { if(submitCodeBtn && !submitCodeBtn.disabled) submitCodeBtn.click(); };
            activateProctoring(submissionCallback);
            startProblemTimer(30, submissionCallback);

            runCodeBtn.addEventListener('click', async () => { const userCode = editor.getValue(); const userInput = document.getElementById('stdInput').value; runCodeBtn.disabled = true; submitCodeBtn.disabled = true; runCodeBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Running...`; document.getElementById('outputArea').textContent = 'Executing...'; try { const response = await fetch(`${liveServerUrl}/api/compile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script: userCode, stdin: userInput }) }); const result = await response.json(); if(result.output) { document.getElementById('outputArea').textContent = result.output; } else if (result.error) { document.getElementById('outputArea').textContent = result.error; } } catch (error) { document.getElementById('outputArea').textContent = "Error connecting to compiler."; } finally { runCodeBtn.disabled = false; submitCodeBtn.disabled = false; runCodeBtn.innerHTML = `Run Code`; } });
            
            submitCodeBtn.addEventListener('click', async () => {
                if (isSubmitting) return;
                isSubmitting = true;
                deactivateProctoring();
                clearInterval(problemTimerInterval);
                const studentId = document.getElementById('studentIdInput').value.trim();
                if (!studentId) { alert('Please enter your USN Number to submit.'); isSubmitting = false; return; }
                const submittedCode = editor.getValue();
                submitCodeBtn.disabled = true; runCodeBtn.disabled = true; submitCodeBtn.textContent = 'Submitting...';
                try {
                    const submitResponse = await fetch(`${liveServerUrl}/api/coding-problems/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, problemId, submittedCode }) });
                    if (!submitResponse.ok) throw new Error('Submission failed.');
                    const submissionToast = new bootstrap.Toast(document.getElementById('submissionToast'));
                    submissionToast.show();
                    setTimeout(loadProblemList, 2000);
                } catch (error) {
                    alert('An error occurred during submission.');
                    submitCodeBtn.disabled = false; runCodeBtn.disabled = false; submitCodeBtn.textContent = 'Submit Final Code';
                    isSubmitting = false;
                }
            });
        } catch (error) { console.error('Failed to load problem:', error); codingContainer.innerHTML = '<p class="text-danger">Could not load the problem.</p>'; }
    }

    function startProblemTimer(durationMinutes, submissionCallback) {
        let timeLeft = durationMinutes * 60;
        const timerElement = document.getElementById('problemTimer');
        problemTimerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            seconds = seconds < 10 ? '0' + seconds : seconds;
            if (timerElement) timerElement.textContent = `Time Left: ${minutes}:${seconds}`;
            if (timeLeft <= 0) {
                clearInterval(problemTimerInterval);
                if (timerElement) timerElement.textContent = 'Time Up!';
                handleCheatingAttempt(submissionCallback);
            }
        }, 1000);
    }
});