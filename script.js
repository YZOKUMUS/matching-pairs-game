// Global variables for pagination and scoring
let currentPage = 0;
let dataPerPage = 10;
let currentData = [];
let currentMatchedItems = new Set();
let data = [];
let score = 0;

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
            updateScoreDisplay();
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

// Populate Sure Selector
function populateSureSelector(data) {
    const sureSelector = document.getElementById("sure-selector");

sureSelector.addEventListener("change", () => {
    const selectedSure = sureSelector.value;
    filterDataBySure(selectedSure); // Seçilen sureye göre filtre uygula
});
    
    
    
    
    
    
    const sureAdlari = Array.from(new Set(data.map(item => item.sure_adi)));

    sureAdlari.forEach(sure => {
        const option = document.createElement("option");
        option.value = sure;
        option.textContent = sure;
        sureSelector.appendChild(option);
    });

    sureSelector.addEventListener("change", () => {
        const selectedSure = sureSelector.value;
        filterDataBySure(selectedSure);
    });
}

// Filter data by sure                                  
function filterDataBySure(selectedSure) {                   
    if (selectedSure === "all") {
        loadPage(0); // Load all data
    } else {
        currentData = data.filter(item => item.sure_adi === selectedSure);
        currentPage = 0;
        loadPage(currentPage);
    }
}

// Create sound box
function createSoundBox(soundUrl, index) {
    const soundBox = document.createElement("div");
    soundBox.classList.add("sound-box");
    soundBox.dataset.index = index;

    const soundIcon = document.createElement("img");
    soundIcon.src = "P.png";
    soundIcon.alt = "Ses oynat";
    soundIcon.classList.add("sound-icon");

    soundBox.appendChild(soundIcon);

    if (currentMatchedItems.has(index)) {
        soundBox.classList.add("matched");
    }

    soundBox.addEventListener("click", () => {
        if (soundBox.classList.contains("matched")) return;

        const audio = new Audio(soundUrl);
        audio.play();

        const selectedSoundBox = document.querySelector(".sound-box.selected");
        if (selectedSoundBox) {
            selectedSoundBox.classList.remove("selected");
        }
        soundBox.classList.add("selected");
    });

    return soundBox;
}

// Create word box
function createWordBox(word, soundIndex) {
    const wordBox = document.createElement("div");
    wordBox.classList.add("word-box");
    wordBox.textContent = word;
    wordBox.dataset.soundIndex = soundIndex;

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
        wordBox.classList.add("matched");
        selectedSoundBox.classList.add("matched");

        setTimeout(() => {
            wordBox.remove();
            selectedSoundBox.remove();
        }, 500);

        currentMatchedItems.add(soundIndex);
        score++;
        updateScoreDisplay();
        saveGameState();

        if (currentMatchedItems.size === currentData.length) {
            alert("Tüm eşleşmeleri tamamladınız!");
        }
    } else if (selectedSoundBox) {
        selectedSoundBox.classList.remove("selected");
    }
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
    currentData = currentData.slice(start, end);

    shuffleArray(currentData);

    const sounds = currentData.map((item, index) => createSoundBox(item.sound_url, index));
    const words = currentData.map((item, index) => createWordBox(item.turkish_meaning, index));
    shuffleArray(sounds);
    shuffleArray(words);

    sounds.forEach(sound => soundColumn.appendChild(sound));
    words.forEach(word => wordColumn.appendChild(word));
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

        populateSureSelector(data);
        loadGameState();
        loadPage(currentPage);
    } catch (error) {
        console.error("JSON verisi yüklenirken hata oluştu:", error);
        alert("Oyun verileri yüklenemedi.");
    }
}

initializeGame();