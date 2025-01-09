// Global variables for pagination and scoring
let currentPage = 0;
let dataPerPage = 10;
let currentData = [];
let currentMatchedItems = new Set();
let data = [];
let score = 0; // Initialize score

// Helper function to update score display
function updateScoreDisplay() {
    const scoreElement = document.getElementById("score");
    scoreElement.textContent = score;
}

// Helper function to save the game state
function saveGameState() {
    try {
        const gameState = {
            currentPage,
            matchedItems: Array.from(currentMatchedItems),
            score,
        };
        localStorage.setItem("gameState", JSON.stringify(gameState));
    } catch (e) {
        console.error("Failed to save game state:", e);
    }
}

// Helper function to load the game state
function loadGameState() {
    try {
        const savedState = localStorage.getItem("gameState");
        if (savedState) {
            const { currentPage: savedPage, matchedItems: savedMatchedItems, score: savedScore } = JSON.parse(savedState);
            currentPage = savedPage || 0;
            currentMatchedItems = new Set(savedMatchedItems || []);
            score = savedScore || 0;
            updateScoreDisplay(); // Update score display after loading
        }
    } catch (e) {
        console.error("Failed to load game state:", e);
    }
}

// Shuffle function to randomize the order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Ses kutusu oluşturma fonksiyonu
function createSoundBox(arabicWord, index) {
    const soundBox = document.createElement("div");
    soundBox.classList.add("sound-box");
    soundBox.dataset.index = index;
    soundBox.setAttribute("aria-label", `Ses oynat: ${arabicWord}`);
    soundBox.setAttribute("role", "button");

    // Ses simgesi için img etiketi oluşturma
    const soundIcon = document.createElement("img");
    soundIcon.src = "P.png"; // Gerekirse doğru yolu buraya ekleyin
    soundIcon.alt = "Ses oynat";
    soundIcon.classList.add("sound-icon");

    soundBox.appendChild(soundIcon);

    if (currentMatchedItems.has(index)) {
        soundBox.classList.add("matched");
    }

    soundBox.addEventListener("click", () => {
        if (soundBox.classList.contains("matched")) return;
    
        const audio = new Audio(arabicWord); // Arapça kelime yerine sound_url kullanılmalı
        audio.play();
    
        const selectedSoundBox = document.querySelector(".sound-box.selected");
        if (selectedSoundBox) {
            selectedSoundBox.classList.remove("selected");
        }
        soundBox.classList.add("selected");
    });

    return soundBox;
}



// Function to create word box
function createWordBox(word, soundIndex) {
    const wordBox = document.createElement("div");
    wordBox.classList.add("word-box");
    wordBox.textContent = word;
    wordBox.dataset.soundIndex = soundIndex;
    wordBox.setAttribute("aria-label", `Match the word: ${word}`);

    if (currentMatchedItems.has(soundIndex)) {
        wordBox.classList.add("matched");
    }

    wordBox.addEventListener("click", (event) => {
        handleWordBoxClick(event, soundIndex);
    });

    return wordBox;
}

// Handle word box click
function handleWordBoxClick(event, soundIndex) {
    const wordBox = event.currentTarget;
    if (wordBox.classList.contains("matched")) return;

    const selectedSoundBox = document.querySelector(".sound-box.selected");
    if (selectedSoundBox && parseInt(selectedSoundBox.dataset.index) === soundIndex) {
        wordBox.classList.add("matched", "disappear");
        selectedSoundBox.classList.add("matched", "disappear");

        setTimeout(() => {
            wordBox.remove();
            selectedSoundBox.remove();
        }, 500);

        wordBox.setAttribute("aria-label", `Matched word: ${wordBox.textContent}`);
        selectedSoundBox.setAttribute("aria-label", `Matched sound`);
        currentMatchedItems.add(soundIndex);
        score++; // Increment score
        updateScoreDisplay();
        saveGameState();

        if (currentMatchedItems.size === currentData.length) {
            alert("Tüm eşleşmeleri tamamladınız!");
            if (currentPage < Math.floor(data.length / dataPerPage)) {
                currentPage++;
                saveGameState();
                loadPage(currentPage);
            } else {
                alert("Oyunu başarıyla tamamladınız!");
                resetGame();
            }
        }
    } else if (selectedSoundBox) {
        selectedSoundBox.classList.remove("selected");
    }
}

// Function to reset the game
function resetGame() {
    currentPage = 0;
    currentMatchedItems.clear();
    score = 0;
    saveGameState();
    loadPage(currentPage);
}

// Load data for the current page
function loadPage(page) {
    const soundColumn = document.getElementById("sound-column");
    const wordColumn = document.getElementById("word-column");
    const paginationContainer = document.getElementById("pagination-container");

    soundColumn.innerHTML = "";
    wordColumn.innerHTML = "";
    currentMatchedItems.clear();

    const start = page * dataPerPage;
    const end = Math.min(start + dataPerPage, data.length);
    currentData = data.slice(start, end);

    if (currentData.length === 0) {
        alert("Gösterilecek veri yok!");
        return;
    }

    shuffleArray(currentData);

    const sounds = currentData.map((item, index) => createSoundBox(item.sound_url, index));
    const words = currentData.map((item, index) => createWordBox(item.turkish_meaning, index));
    shuffleArray(sounds);
    shuffleArray(words);

    const fragmentSounds = document.createDocumentFragment();
    const fragmentWords = document.createDocumentFragment();

    sounds.forEach((sound) => fragmentSounds.appendChild(sound));
    words.forEach((word) => fragmentWords.appendChild(word));

    soundColumn.appendChild(fragmentSounds);
    wordColumn.appendChild(fragmentWords);

    updatePaginationButtons(paginationContainer);
}

// Pagination control
function updatePaginationButtons(paginationContainer) {
    paginationContainer.innerHTML = "";

    const previousButton = document.createElement("button");
    previousButton.textContent = "Önceki";
    previousButton.disabled = currentPage === 0;
    previousButton.addEventListener("click", () => {
        currentPage--;
        saveGameState();
        loadPage(currentPage);
    });

    const nextButton = document.createElement("button");
    nextButton.textContent = "Sonraki";
    nextButton.disabled = currentPage >= Math.floor((data.length - 1) / dataPerPage);
    nextButton.addEventListener("click", () => {
        currentPage++;
        saveGameState();
        loadPage(currentPage);
    });

    paginationContainer.appendChild(previousButton);
    paginationContainer.appendChild(nextButton);
}

// Initialize the game
async function initializeGame() {
    try {
        const response = await fetch("data.json");
        const dataResponse = await response.json();
        if (!dataResponse || dataResponse.length === 0) {
            throw new Error("JSON dosyasında veri bulunamadı.");
        }
        data = dataResponse;
        loadGameState();
        loadPage(currentPage);
    } catch (error) {
        console.error("JSON verisi yüklenirken hata oluştu:", error);
        alert("Oyun verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    }
}

initializeGame();
