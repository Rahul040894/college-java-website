// js/script.js (The Final, Fully-Robust Production Version)

document.addEventListener('DOMContentLoaded', () => {
    // A single source of truth for your live server URL
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';

    // --- Background Image Changer ---
    const backgroundElement = document.querySelector('body.full-bg');
    if (backgroundElement) {
        const backgroundImages = ['images/bg1.jpg', 'images/bg2.jpg', 'images/bg3.jpg'];
        let currentImageIndex = 0;
        backgroundElement.style.backgroundImage = `url('${backgroundImages[0]}')`;
        const changeBackgroundImage = () => {
            currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
            backgroundElement.style.backgroundImage = `url('${backgroundImages[currentImageIndex]}')`;
        };
        setInterval(changeBackgroundImage, 7000);
    }

    // --- Main Logic Router for MCQ Page ---
    const mainContentBox = document.querySelector('.content-box');
    const urlParams = new URLSearchParams(window.location.search);
    const testNameToStart = urlParams.get('test');
    
    if (testNameToStart) {
        startTest(testNameToStart);
    } else if (document.getElementById('test-list-container')) {
        loadTestList();
    }

    // --- MCQ System Functions ---

    async function loadTestList() {
        const testListContainer = document.getElementById('test-list-container');
        const longLoadTimer = setTimeout(() => {
            if (testListContainer) testListContainer.innerHTML = '<p class="text-info">The server is waking up, this can take up to a minute. Please be patient...</p>';
        }, 8000);

        try {
            const response = await fetch(`${liveServerUrl}/api/tests`);
            clearTimeout(longLoadTimer);
            if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
            const tests = await response.json();
            if (tests.length === 0) { testListContainer.innerHTML = '<p>No tests have been added yet.</p>'; return; }
            testListContainer.innerHTML = '';
            tests.forEach(test => {
                const testLink = document.createElement('a');
                testLink.href = `mcq-test.html?test=${test.name}`;
                testLink.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                testLink.innerHTML = `<strong>${test.name.replace(/-/g, ' ').toUpperCase()}</strong><span class="badge bg-primary rounded-pill">${test.questionCount} Questions</span>`;
                testListContainer.appendChild(testLink);
            });
        } catch (error) {
            clearTimeout(longLoadTimer);
            console.error('Failed to load test list:', error);
            if (testListContainer) testListContainer.innerHTML = '<p class="text-danger">Could not load tests. Please try refreshing the page in a moment.</p>';
        }
    }

    async function startTest(testName) {
        // THIS IS THE UPDATED FUNCTION
        mainContentBox.innerHTML = `<h2>${testName.replace(/-/g, ' ').toUpperCase()}</h2><hr><div id="test-area"><p>Loading questions... The server may be waking up.</p></div>`;
        const testArea = document.getElementById('test-area');

        const longLoadTimer = setTimeout(() => {
            if (testArea) testArea.innerHTML = '<p class="text-info">The server is taking a moment to start. This can take up to a minute. Please be patient...</p>';
        }, 8000);

        const url = `${liveServerUrl}/api/test/${testName}`;
        try {
            const response = await fetch(url);
            clearTimeout(longLoadTimer);
            if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
            const questions = await response.json();
            displayQuestions(questions, testName);
        } catch (error) {
            clearTimeout(longLoadTimer);
            console.error("Could not fetch questions:", error);
            if(testArea) testArea.innerHTML = `<p class="text-danger">Failed to load the test. Please go back to the list and try again.</p>`;
        }
    }

    function displayQuestions(questions, testName) {
        const testArea = document.getElementById('test-area');
        const formHTML = `<form id="mcq-form"></form>`;
        testArea.innerHTML = formHTML;
        const mcqForm = document.getElementById('mcq-form');
        questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'mb-4';
            let optionsHTML = q.options.map(option => `<div class="form-check"><input class="form-check-input" type="radio" name="question${q.id}" value="${option}" required><label class="form-check-label">${option}</label></div>`).join('');
            questionElement.innerHTML = `<h5>${index + 1}. ${q.question}</h5>${optionsHTML}`;
            mcqForm.appendChild(questionElement);
        });
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'btn btn-success mt-3';
        submitButton.textContent = 'Submit Answers';
        mcqForm.appendChild(submitButton);
        mcqForm.addEventListener('submit', (event) => submitTest(event, testName));
    }

    async function submitTest(event, testName) {
        event.preventDefault();
        const mcqForm = document.getElementById('mcq-form');
        const answers = [];
        const questionInputs = mcqForm.querySelectorAll('input[type="radio"]:checked');
        const totalQuestions = mcqForm.querySelectorAll('h5').length;
        if (questionInputs.length < totalQuestions) { alert('Please answer all questions.'); return; }
        questionInputs.forEach(input => { answers.push({ id: input.name.replace('question', ''), answer: input.value }); });
        const url = `${liveServerUrl}/api/submit/${testName}`;
        try {
            const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) });
            const result = await response.json();
            displayResult(result, testName);
        } catch (error) { console.error("Could not submit test:", error); }
    }

    function displayResult(result, testName) {
        const percentage = (result.score / result.total) * 100;
        let feedbackMessage = percentage >= 80 ? 'Excellent work!' : 'Keep practicing!';
        mainContentBox.innerHTML = `<h3>Test Complete!</h3><h4>Your Score: ${result.score} out of ${result.total}</h4><div class="progress" style="height: 25px;"><div class="progress-bar bg-success" role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}">${percentage.toFixed(0)}%</div></div><p class="mt-3">${feedbackMessage}</p><a href="mcq-test.html?test=${testName}" class="btn btn-info">Try Again</a><a href="mcq-test.html" class="btn btn-secondary">Back to Test List</a>`;
    }

    // --- Online Compiler Logic ---
    const runButton = document.getElementById('runButton');
    if (runButton) {
        const editor = CodeMirror(document.getElementById('codeEditor'), { value: `public class MyClass {\n    public static void main(String args[]) {\n        System.out.println("Hello, World!");\n    }\n}`, mode: "text/x-java", theme: "dracula", lineNumbers: true, autoCloseBrackets: true });
        editor.setSize(null, "500px");
        const stdInput = document.getElementById('stdInput');
        runButton.addEventListener('click', async () => {
            const userCode = editor.getValue();
            const userInput = stdInput.value;
            runButton.disabled = true;
            runButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Waking Server...`;
            outputArea.textContent = 'Connecting to the server...';
            const longLoadTimer = setTimeout(() => { outputArea.textContent = 'Server is waking up. Please be patient...'; }, 8000);
            try {
                const response = await fetch(`${liveServerUrl}/api/compile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script: userCode, stdin: userInput }) });
                clearTimeout(longLoadTimer);
                const result = await response.json();
                if (result.error) { outputArea.textContent = result.error; } else if (result.output) { outputArea.textContent = result.output; } else { outputArea.textContent = "Execution finished, no output."; }
            } catch (error) {
                clearTimeout(longLoadTimer);
                outputArea.textContent = 'Could not connect. Please try again.';
            } finally {
                runButton.disabled = false;
                runButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg> Run Code`;
            }
        });
    }
});