// js/script.js (Final Production Version with stdin support)

document.addEventListener('DOMContentLoaded', () => {
    const liveServerUrl = 'https://my-java-course-backend.onrender.com';

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

   // In js/script.js

async function loadTestList() {
    // A timer to update the message if it's taking too long
    const longLoadTimer = setTimeout(() => {
        if (testListContainer) {
            testListContainer.innerHTML = '<p class="text-info">The server is waking up, this can take up to a minute. Please be patient...</p>';
        }
    }, 8000); // After 8 seconds

    try {
        const response = await fetch(`${liveServerUrl}/api/tests`);
        clearTimeout(longLoadTimer); // The server was awake! Stop the timer.

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const tests = await response.json();

        if (tests.length === 0) {
            testListContainer.innerHTML = '<p>No tests have been added yet.</p>';
            return;
        }

        testListContainer.innerHTML = ''; // Clear "Loading..."
        tests.forEach(test => {
            const testLink = document.createElement('a');
            testLink.href = `mcq-test.html?test=${test.name}`;
            testLink.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            testLink.innerHTML = `<strong>${test.name.replace(/-/g, ' ').toUpperCase()}</strong><span class="badge bg-primary rounded-pill">${test.questionCount} Questions</span>`;
            testListContainer.appendChild(testLink);
        });

    } catch (error) {
        clearTimeout(longLoadTimer); // Also clear the timer on error
        console.error('Failed to load test list:', error);
        if (testListContainer) {
            testListContainer.innerHTML = '<p class="text-danger">Could not load tests. The server might be busy. Please try refreshing the page in a moment.</p>';
        }
    }
}
    async function startTest(testName) {
        // ... this function remains the same
    }
    function displayQuestions(questions, testName) {
        // ... this function remains the same
    }
    async function submitTest(event, testName) {
        // ... this function remains the same
    }
    function displayResult(result, testName) {
        // ... this function remains the same
    }

    // =======================================================
    // == START: ONLINE COMPILER LOGIC (WITH CODEMIRROR & stdin) ==
    // =======================================================
    const runButton = document.getElementById('runButton');
    const outputArea = document.getElementById('outputArea');
    const stdInput = document.getElementById('stdInput'); // Get the new stdin element

    if (runButton) {
        const editor = CodeMirror(document.getElementById('codeEditor'), {
            value: `public class MyClass {\n    public static void main(String args[]) {\n        // Your code goes here!\n        System.out.println("Hello, World!");\n    }\n}`,
            mode: "text/x-java",
            theme: "dracula",
            lineNumbers: true,
            autoCloseBrackets: true
        });
        editor.setSize(null, "500px");

        runButton.addEventListener('click', async () => {
            const userCode = editor.getValue();
            const userInput = stdInput.value; // Get the value from the stdin box

            runButton.disabled = true;
            runButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Waking Server...`;
            outputArea.textContent = 'Connecting to the server. This may take a moment on the first run...';

            const longLoadTimer = setTimeout(() => {
                outputArea.textContent = 'Server is waking up. This can take up to a minute. Please be patient...';
            }, 8000);

            try {
                const response = await fetch(`${liveServerUrl}/api/compile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ script: userCode, stdin: userInput }) // Send both script and stdin
                });

                clearTimeout(longLoadTimer);

                const result = await response.json();
                if (result.error) {
                    outputArea.textContent = result.error;
                } else if (result.output) {
                    outputArea.textContent = result.output;
                } else {
                    outputArea.textContent = "Execution finished, but no output was produced.";
                }
            } catch (error) {
                clearTimeout(longLoadTimer);
                console.error('Error during compilation:', error);
                outputArea.textContent = 'Could not connect to the server. It might be waking up. Please try again in a moment.';
            } finally {
                runButton.disabled = false;
                runButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg> Run Code`;
            }
        });
    }

}); // Final closing bracket for DOMContentLoaded