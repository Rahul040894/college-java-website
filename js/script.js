// js/script.js (The Truly Final Production Version with All Features and UX Enhancements)

document.addEventListener('DOMContentLoaded', () => {
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';
    let isSubmitting = false;
    let problemTimerInterval;

    // --- Feature Flag Logic ---
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
    const handleCheatingAttempt = (callback) => { if (!isSubmitting) { alert("Since you have navigated away from the test, your code is getting auto-submitted now! Attempt next question now!"); if (callback && typeof callback === 'function') callback(); } };
    function activateEditorProctoring(editorInstance) { editorInstance.on('copy', (instance, event) => handleDisabledAction(event)); editorInstance.on('cut', (instance, event) => handleDisabledAction(event)); const editorWrapper = editorInstance.getWrapperElement(); editorWrapper.addEventListener('paste', handleDisabledAction); editorWrapper.addEventListener('contextmenu', handleDisabledAction); editorInstance.on('beforeChange', (instance, changeObj) => { if (changeObj.origin === 'paste') { changeObj.cancel(); if (proctorToast) proctorToast.show(); } }); }
    function activatePageProctoring(submissionCallback) { const visibilityHandler = () => { if (document.hidden) handleCheatingAttempt(submissionCallback); }; const blurHandler = () => handleCheatingAttempt(submissionCallback); window.proctoringListeners = { visibilityHandler, blurHandler }; document.addEventListener('visibilitychange', window.proctoringListeners.visibilityHandler); window.addEventListener('blur', window.proctoringListeners.blurHandler); }
    function deactivateProctoring() { document.removeEventListener('copy', handleDisabledAction); document.removeEventListener('paste', handleDisabledAction); document.removeEventListener('cut', handleDisabledAction); document.removeEventListener('contextmenu', handleDisabledAction); if (window.proctoringListeners) { document.removeEventListener('visibilitychange', window.proctoringListeners.visibilityHandler); document.removeEventListener('blur', window.proctoringListeners.blurHandler); window.proctoringListeners = null; } clearInterval(problemTimerInterval); }

    // --- Online Compiler Logic ---
    const runButton = document.getElementById('runButton');
    if (runButton) { const editor = CodeMirror(document.getElementById('codeEditor'), { value: `public class MyClass {\n    public static void main(String args[]) {\n        System.out.println("Hello, World!");\n    }\n}`, mode: "text/x-java", theme: "dracula", lineNumbers: true, autoCloseBrackets: true }); editor.setSize(null, "500px"); activateEditorProctoring(editor); const stdInput = document.getElementById('stdInput'); const outputArea = document.getElementById('outputArea'); runButton.addEventListener('click', async () => { const userCode = editor.getValue(); const userInput = stdInput.value; runButton.disabled = true; runButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Waking Server...`; outputArea.textContent = 'Connecting to the server...'; const longLoadTimer = setTimeout(() => { outputArea.textContent = 'Server is waking up. Please be patient...'; }, 8000); try { const response = await fetch(`${liveServerUrl}/api/compile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script: userCode, stdin: userInput }) }); clearTimeout(longLoadTimer); const result = await response.json(); if (result.error) { outputArea.textContent = result.error; } else if (result.output) { outputArea.textContent = result.output; } else { outputArea.textContent = "Execution finished, no output."; } } catch (error) { clearTimeout(longLoadTimer); outputArea.textContent = 'Could not connect. Please try again.'; } finally { runButton.disabled = false; runButton.innerHTML = `Run Code`; } }); }
    
    // =======================================================
    // == START: CODING PROBLEMS LOGIC (FINAL, CORRECTED VERSION) ==
    // =======================================================
    const codingContainer = document.getElementById('coding-container');
    const codingEntryContainer = document.getElementById('coding-entry-container');
    const accessProblemsBtn = document.getElementById('accessProblemsBtn');

    if (codingContainer) {
        // This is the router for the page. It decides what to show.
        const loggedInUsn = localStorage.getItem('codingStudentId');
        if (loggedInUsn) {
            // If already logged in, hide form and show problems
            codingEntryContainer?.classList.add('d-none');
            codingContainer.classList.remove('d-none');
            loadProblemList();
        } else {
            // If not logged in, ensure form is visible and container is hidden.
            codingEntryContainer?.classList.remove('d-none');
            codingContainer.classList.add('d-none');
            if (accessProblemsBtn) {
                accessProblemsBtn.addEventListener('click', handleCodingAccess);
            }
        }
    }

    async function handleCodingAccess(e) {
        if (e) e.preventDefault();
        const studentIdInput = document.getElementById('codingStudentId');
        const studentId = studentIdInput.value.trim();
        if (!studentId) { showError('coding-entry-error', 'Please enter your USN.'); return; }
        accessProblemsBtn.disabled = true; accessProblemsBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Verifying...`;
        try {
            const response = await fetch(`${liveServerUrl}/api/validate-usn`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId }) });
            const result = await response.json();
            if (!result.valid) throw new Error(result.message || 'USN not authorized.');
            localStorage.setItem('codingStudentId', result.usn);
            codingEntryContainer.classList.add('d-none');
            codingContainer.classList.remove('d-none');
            loadProblemList();
        } catch (error) {
            showError('coding-entry-error', error.message);
            accessProblemsBtn.disabled = false; accessProblemsBtn.innerHTML = `Access Problems`;
        }
    }
    
    async function loadProblemList() { isSubmitting = false; deactivateProctoring(); codingContainer.innerHTML = `<h2>Coding Problems</h2><p>Select a problem. Each has a 30-minute time limit and is proctored.</p><hr><div id="problem-list"><p>Loading...</p></div>`; try { const problemListContainer = document.getElementById('problem-list'); const response = await fetch(`${liveServerUrl}/api/coding-problems`); const problems = await response.json(); if (problems.length === 0) { problemListContainer.innerHTML = '<p>No coding problems have been added yet.</p>'; return; } problemListContainer.innerHTML = ''; problems.forEach(problem => { const problemLink = document.createElement('a'); problemLink.href = '#'; problemLink.className = 'list-group-item list-group-item-action'; problemLink.innerHTML = `<strong>${problem.title}</strong><span class="badge bg-secondary rounded-pill float-end">${problem.topic}</span>`; problemLink.onclick = (e) => { e.preventDefault(); loadSingleProblem(problem._id); }; problemListContainer.appendChild(problemLink); }); } catch (error) { console.error('Failed to load problem list:', error); codingContainer.innerHTML = '<p class="text-danger">Could not load problems.</p>'; } }
    
    async function loadSingleProblem(problemId) { codingContainer.innerHTML = `<p>Loading problem...</p>`; try { const response = await fetch(`${liveServerUrl}/api/coding-problems/${problemId}`); const problem = await response.json(); codingContainer.innerHTML = `<button id="backToListBtn" class="btn btn-sm btn-outline-secondary mb-3">&larr; Back to Problem List</button><div class="d-flex justify-content-between align-items-center"><h3>${problem.title}</h3><h4 id="problemTimer" class="badge bg-danger p-2">Time Left: 30:00</h4></div><p>${problem.description.replace(/\n/g, '<br>')}</p><hr><h5>Example:</h5><pre><strong>Input:</strong>\n${problem.exampleInput}\n\n<strong>Output:</strong>\n${problem.exampleOutput.replace(/<code>/g, '').replace(/<\/code>/g, '').replace(/<pre>/g, '').replace(/<\/pre>/g, '')}</pre><hr><div class="row"><div class="col-lg-8"><h5>Your Solution:</h5><div id="codeEditorDiv" class="mb-3"></div><h5>Standard Input (for testing):</h5><textarea id="stdInput" class="form-control" rows="3"></textarea></div><div class="col-lg-4"><h5>Test Output:</h5><pre id="outputArea" class="bg-dark text-white p-3 rounded" style="min-height: 300px; overflow-y: auto;"></pre></div></div><div class="mt-3"><button id="runCodeBtn" class="btn btn-success">Run Code</button> <button id="submitCodeBtn" class="btn btn-primary">Submit Final Code</button></div>`; document.getElementById('backToListBtn').onclick = () => { deactivateProctoring(); loadProblemList(); }; const editor = CodeMirror(document.getElementById('codeEditorDiv'), { value: `public class Solution {\n    // Note: The class name must be 'Solution' for the code to run correctly.\n    public static void main(String args[]) {\n        // Your solution here\n    }\n}`, mode: "text/x-java", theme: "dracula", lineNumbers: true, autoCloseBrackets: true }); editor.setSize(null, "400px"); activateEditorProctoring(editor); const runCodeBtn = document.getElementById('runCodeBtn'); const submitCodeBtn = document.getElementById('submitCodeBtn'); const submissionCallback = () => { if(submitCodeBtn && !submitCodeBtn.disabled) submitCodeBtn.dispatchEvent(new Event('click')); }; activatePageProctoring(submissionCallback); startProblemTimer(30, submissionCallback); runCodeBtn.addEventListener('click', async () => { const userCode = editor.getValue(); const userInput = document.getElementById('stdInput').value; runCodeBtn.disabled = true; submitCodeBtn.disabled = true; runCodeBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Running...`; document.getElementById('outputArea').textContent = 'Executing...'; try { const response = await fetch(`${liveServerUrl}/api/compile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script: userCode, stdin: userInput }) }); const result = await response.json(); if(result.output) { document.getElementById('outputArea').textContent = result.output; } else if (result.error) { document.getElementById('outputArea').textContent = result.error; } } catch (error) { document.getElementById('outputArea').textContent = "Error connecting to compiler."; } finally { runCodeBtn.disabled = false; submitCodeBtn.disabled = false; runCodeBtn.innerHTML = `Run Code`; } });
        submitCodeBtn.addEventListener('click', async (event) => { if (event) event.preventDefault(); if (isSubmitting) return; isSubmitting = true; deactivateProctoring(); const studentId = localStorage.getItem('codingStudentId'); if (!studentId) { alert('USN not found. Please go back and re-validate.'); isSubmitting = false; return; } const submittedCode = editor.getValue(); submitCodeBtn.disabled = true; runCodeBtn.disabled = true; submitCodeBtn.textContent = 'Submitting...'; try { const submitResponse = await fetch(`${liveServerUrl}/api/coding-problems/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, problemId, submittedCode }) }); const result = await submitResponse.json(); if (!submitResponse.ok) { alert(result.message); loadProblemList(); return; } const submissionToast = new bootstrap.Toast(document.getElementById('submissionToast')); submissionToast.show(); setTimeout(() => { isSubmitting = false; loadProblemList(); }, 2000); } catch (error) { alert('An error occurred during submission.'); submitCodeBtn.disabled = false; runCodeBtn.disabled = false; submitCodeBtn.textContent = 'Submit Final Code'; isSubmitting = false; } });
    } catch (error) { console.error('Failed to load problem:', error); codingContainer.innerHTML = '<p class="text-danger">Could not load the problem.</p>'; } }
    function startProblemTimer(durationMinutes, submissionCallback) { let timeLeft = durationMinutes * 60; const timerElement = document.getElementById('problemTimer'); problemTimerInterval = setInterval(() => { timeLeft--; const minutes = Math.floor(timeLeft / 60); let seconds = timeLeft % 60; seconds = seconds < 10 ? '0' + seconds : seconds; if (timerElement) timerElement.textContent = `Time Left: ${minutes}:${seconds}`; if (timeLeft <= 0) { if (timerElement) timerElement.textContent = 'Time Up!'; handleCheatingAttempt(submissionCallback); } }, 1000); }
    function showError(elementId, message) { const errorEl = document.getElementById(elementId); if (errorEl) { errorEl.textContent = message; errorEl.classList.remove('d-none'); } }
});