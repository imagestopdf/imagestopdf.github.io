// gk page 1 script code

function toggleMenu() {
    const menu = document.getElementById('menu');
    const hamburger = document.querySelector('.hamburger-icon');
    menu.classList.toggle('active');
    
    if (menu.classList.contains('active')) {
        hamburger.innerHTML = '&#10006;'; // Cross icon (X)
    } else {
        hamburger.innerHTML = '&#9776;'; // Three lines icon
    }
}


const questions = [
{ question: "Which is the smallest country in the world by land area?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correct: 1 },
{ question: "Who was the first human to travel into space?", options: ["Neil Armstrong", "Yuri Gagarin", "Alan Shepard", "Valentina Tereshkova"], correct: 1 },
{ question: "Which is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], correct: 1 },
{ question: "In which year did World War II end?", options: ["1945", "1939", "1950", "1942"], correct: 0 },
{ question: "What is the capital city of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
{ question: "Which planet is known as the Red Planet?", options: ["Earth", "Venus", "Mars", "Jupiter"], correct: 2 },
{ question: "Who wrote the play 'Romeo and Juliet'?", options: ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"], correct: 0 },
{ question: "Which ocean is the largest in the world?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct: 2 },
{ question: "Mount Everest lies in which mountain range?", options: ["Alps", "Himalayas", "Andes", "Rockies"], correct: 1 },
{ question: "Which is the fastest land animal?", options: ["Cheetah", "Leopard", "Horse", "Lion"], correct: 0 },
{ question: "In which country were the Olympic Games originated?", options: ["Italy", "Greece", "France", "Egypt"], correct: 1 },
{ question: "What is the chemical symbol for gold?", options: ["Ag", "Au", "Pb", "Pt"], correct: 1 },
{ question: "Which continent is known as the 'Dark Continent'?", options: ["Asia", "Africa", "South America", "Europe"], correct: 1 },
{ question: "Who invented the telephone?", options: ["Alexander Graham Bell", "Thomas Edison", "Nikola Tesla", "Michael Faraday"], correct: 0 },
{ question: "Which country is the largest producer of coffee?", options: ["Vietnam", "Colombia", "Brazil", "Ethiopia"], correct: 2 },
{ question: "Which gas do humans exhale during respiration?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Helium"], correct: 1 },
{ question: "The Great Wall of China was primarily built to protect against which group?", options: ["Huns", "Mongols", "Romans", "Persians"], correct: 1 },
{ question: "Who was the first woman to win a Nobel Prize?", options: ["Marie Curie", "Mother Teresa", "Rosalind Franklin", "Ada Lovelace"], correct: 0 },
{ question: "What is the currency of Japan?", options: ["Yuan", "Yen", "Won", "Ringgit"], correct: 1 },
{ question: "Which desert is the largest in the world?", options: ["Sahara", "Gobi", "Arabian", "Kalahari"], correct: 0 }
];

let currentQuestionIndex = 0;
let score = 0;
let attempts = 0;
let selectedAnswer = null;
let timer;
let userAnswers = [];

function escapeHTML(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function startTest() {
    document.getElementById("startContainer").style.display = "none";
    document.getElementById("quizContainer").style.display = "block";
    loadQuestion();
}

function startTimer() {
    let timeLeft = 60;
    document.getElementById("timer").textContent = `Time Left: ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = `Time Left: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            nextQuestion();
        }
    }, 1000);
}

function loadQuestion() {
    clearInterval(timer);
    startTimer();
    selectedAnswer = null;

    document.getElementById("questionNumber").textContent = `Question ${attempts + 1} of ${questions.length}`;
    const questionData = questions[currentQuestionIndex];
    document.getElementById("question").innerHTML = escapeHTML(questionData.question);

    const optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    questionData.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.textContent = option;
        button.onclick = () => selectAnswer(button, index);
        optionsContainer.appendChild(button);
    });

    // Next button visible but disabled
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.disabled = true;
    nextBtn.style.opacity = 0.3;
    nextBtn.style.display = "block";
}

function selectAnswer(button, selectedIndex) {
    if (selectedAnswer !== null) {
        document.querySelectorAll("#options button").forEach(btn => btn.classList.remove("selected"));
    }

    selectedAnswer = selectedIndex;
    button.classList.add("selected");

    const nextBtn = document.getElementById("nextBtn");
    nextBtn.disabled = false;
    nextBtn.style.opacity = 1;
}

function nextQuestion() {
    clearInterval(timer);

    const questionObj = questions[currentQuestionIndex];
    userAnswers.push({
        question: questionObj.question,
        selected: selectedAnswer !== null ? questionObj.options[selectedAnswer] : "No Answer",
        correct: questionObj.options[questionObj.correct]
    });

    if (selectedAnswer !== null && selectedAnswer === questionObj.correct) {
        score++;
    }

    currentQuestionIndex++;
    attempts++;

    if (attempts < questions.length && currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showFinalResult();
    }
}

function showFinalResult() {
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("resultContainer").style.display = "block";

    // ====== New Pass/Fail Logic ======
    let statusText = "";
    if (score < 8) {
        statusText = "<span class='fail'>❌ Fail</span>";
    } else if (score >= 8 && score < 18) {
        statusText = "<span class='pass'>✅ Pass</span>";
    } else {
        statusText = "<span class='excellent'>🌟 Excellent</span>";
    }

    // Add status before score
    document.getElementById("scoreStatus").innerHTML = `${statusText} &nbsp; Your Score: ${score}`;

    document.getElementById("correctCount").textContent = `Correct Answers: ${score}`;
    document.getElementById("wrongCount").textContent = `Wrong Answers: ${attempts - score}`;


    let detailedResults = document.getElementById("detailedResults");
    detailedResults.innerHTML = "";

    userAnswers.forEach((item, index) => {
        let isCorrect = item.selected === item.correct;
        let icon = isCorrect ? 
        "<span class='right-icon'>&#10004;</span>" 
        : "<span class='wrong-icon'>&#10008;</span>";

        detailedResults.innerHTML += `
            <div class='result-item'>
                <strong>Q${index + 1}: ${item.question}</strong><br>
                Your Answer: ${item.selected} ${icon} <br>
                Correct Answer: ${item.correct} 
            </div>`;
    });
}

function nextQuestion() {
    clearInterval(timer);

    const questionObj = questions[currentQuestionIndex];
    userAnswers.push({
        question: questionObj.question,
        selected: selectedAnswer !== null ? questionObj.options[selectedAnswer] : "No Answer",
        correct: questionObj.options[questionObj.correct]
    });

    if (selectedAnswer !== null && selectedAnswer === questionObj.correct) {
        score++;
    }

    currentQuestionIndex++;
    attempts++;

    if (attempts < questions.length && currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        // Show loading screen
        document.getElementById("quizContainer").style.display = "none";
        document.getElementById("loadingContainer").style.display = "block";

        // After 5 seconds, show final result
        setTimeout(() => {
            document.getElementById("loadingContainer").style.display = "none";
            showFinalResult();
        }, 10000); // 5000 ms = 5 seconds
    }
}

 document.getElementById("gk-h3").innerHTML = `
    <h3 style="color: white; font-size: 22px;">Click on Start Test button to start the test.</h3><br>
  `;