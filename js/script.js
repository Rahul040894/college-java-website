// js/script.js (Final Version with CodeMirror Compiler)

document.addEventListener('DOMContentLoaded', () => {

    // =======================================================
    // == START: AUTOMATIC BACKGROUND IMAGE CHANGER         ==
    // =======================================================
    const backgroundElement = document.querySelector('body.full-bg');
    const backgroundImages = ['images/bg1.jpg', 'images/bg2.jpg', 'images/bg3.jpg'];
    if (backgroundElement) {
        let currentImageIndex = 0;
        backgroundElement.style.backgroundImage = `url('${backgroundImages[0]}')`;
        function changeBackgroundImage() {
            currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
            backgroundElement.style.backgroundImage = `url('${backgroundImages[currentImageIndex]}')`;
        }
        setInterval(changeBackgroundImage, 7000);
    }

    // =======================================================
    // == START: MCQ TEST LOGIC                           ==
    // =======================================================
    const testListContainer = document.getElementById('test-list-container');
    const mainContentBox = document.querySelector('.content-box');
    const urlParams = new URLSearchParams(window.location.search);
    const testNameToStart = urlParams.get('test');

    if (testNameToStart) {
        startTest(testNameToStart);
    } else if (testListContainer) {
        loadTestList();
    }

    async function loadTestList() {
        try {const response = await fetch('https://my-java-course-backend.onrender.com/api/tests');const tests = await response.json();if (tests.length === 0) {testListContainer.innerHTML = '<p>No tests found.</p>';return;}testListContainer.innerHTML = '';tests.forEach(test => {const testLink = document.createElement('a');testLink.href = `mcq-test.html?test=${test.name}`;testLink.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';testLink.innerHTML = `<strong>${test.name.replace(/-/g, ' ').toUpperCase()}</strong><span class="badge bg-primary rounded-pill">${test.questionCount} Questions</span>`;testListContainer.appendChild(testLink);});} catch (error) {console.error('Failed to load test list:', error);testListContainer.innerHTML = '<p class="text-danger">Could not load tests. Is the server running?</p>';}
    }
    async function startTest(testName) {
        mainContentBox.innerHTML = `<h2>${testName.replace(/-/g, ' ').toUpperCase()}</h2><hr><div id="test-area">Loading questions...</div><div id="result-container" class="d-none"></div>`;const testArea = document.getElementById('test-area');const url = `https://my-java-course-backend.onrender.com/api/test/${testName}`;try {const response = await fetch(url);const questions = await response.json();displayQuestions(questions, testName);} catch (error) {console.error("Could not fetch questions:", error);testArea.innerHTML = `<p class="text-danger">Failed to load the test.</p>`;}
    }
    function displayQuestions(questions, testName) {
        const testArea = document.getElementById('test-area');const formHTML = `<form id="mcq-form"></form>`;testArea.innerHTML = formHTML;const mcqForm = document.getElementById('mcq-form');questions.forEach((q, index) => {const questionElement = document.createElement('div');questionElement.className = 'mb-4';let optionsHTML = q.options.map(option => `<div class="form-check"><input class="form-check-input" type="radio" name="question${q.id}" value="${option}" required><label class="form-check-label">${option}</label></div>`).join('');questionElement.innerHTML = `<h5>${index + 1}. ${q.question}</h5>${optionsHTML}`;mcqForm.appendChild(questionElement);});const submitButton = document.createElement('button');submitButton.type = 'submit';submitButton.className = 'btn btn-success mt-3';submitButton.textContent = 'Submit Answers';mcqForm.appendChild(submitButton);mcqForm.addEventListener('submit', (event) => submitTest(event, testName));
    }
    async function submitTest(event, testName) {
        event.preventDefault();const mcqForm = document.getElementById('mcq-form');const answers = [];const questionInputs = mcqForm.querySelectorAll('input[type="radio"]:checked');const totalQuestions = mcqForm.querySelectorAll('h5').length;if (questionInputs.length < totalQuestions) {alert('Please answer all questions.');return;}questionInputs.forEach(input => {answers.push({ id: input.name.replace('question', ''), answer: input.value });});const url = `http://localhost:3000/api/submit/${testName}`;try {const response = await fetch(url, {method: 'POST',headers: { 'Content-Type': 'application/json' },body: JSON.stringify({ answers })});const result = await response.json();displayResult(result, testName);} catch (error) {console.error("Could not submit test:", error);}
    }
    function displayResult(result, testName) {
        const percentage = (result.score / result.total) * 100;let feedbackMessage = percentage >= 80 ? 'Excellent work!' : (percentage >= 50 ? 'Good effort!' : 'Keep practicing!');mainContentBox.innerHTML = `<h3>Test Complete!</h3><h4>Your Score: ${result.score} out of ${result.total}</h4><div class="progress" style="height: 25px;"><div class="progress-bar bg-success" role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}">${percentage.toFixed(0)}%</div></div><p class="mt-3">${feedbackMessage}</p><a href="mcq-test.html?test=${testName}" class="btn btn-info">Try Again</a><a href="mcq-test.html" class="btn btn-secondary">Back to Test List</a>`;
    }

    // =======================================================
    // == START: ONLINE COMPILER LOGIC (WITH CODEMIRROR)    ==
    // =======================================================
    const runButton = document.getElementById('runButton');
    const outputArea = document.getElementById('outputArea');

    // Check if we are on the compiler page by looking for the runButton
    if (runButton) {
        // Initialize CodeMirror Editor
        // We are targeting the div with the id "codeEditor" from compiler.html
        const editor = CodeMirror(document.getElementById('codeEditor'), {
            value: `public class MyClass {\n    public static void main(String args[]) {\n        // Your code goes here!\n        System.out.println("Hello, World!");\n    }\n}`,
            mode: "text/x-java",
            theme: "dracula",
            lineNumbers: true,
            autoCloseBrackets: true
        });
        editor.setSize(null, "500px"); // Set a fixed height for the editor

        runButton.addEventListener('click', async () => {
            // Get code from the editor using its own method
            const userCode = editor.getValue();

            // Show loading state
            runButton.disabled = true;
            runButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Running...`;
            outputArea.textContent = 'Executing your code...';

            try {
                // Send code to our server's proxy endpoint
                const response = await fetch('https://my-java-course-backend.onrender.com/api/compile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ script: userCode })
                });
                const result = await response.json();

                // Display result
                if (result.error) {
                    outputArea.textContent = result.error;
                } else if (result.output) {
                    outputArea.textContent = result.output;
                } else {
                    outputArea.textContent = "Execution finished, but no output was produced.";
                }

            } catch (error) {
                console.error('Error during compilation:', error);
                outputArea.textContent = 'An error occurred while communicating with the server.';
            } finally {
                // Restore button
                runButton.disabled = false;
                runButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg> Run Code`;
            }
        });
    }

}); // <-- The single, final closing bracket and parenthesis