// Global variables for pagination
let currentPage = 0;
let dataPerPage = 10;
let currentData = [];
let currentMatchedItems = new Set(); // Keep track of matched items on the current page

// Helper function to save the game state
function saveGameState() {
    const gameState = {
        currentPage,
        matchedItems: Array.from(currentMatchedItems)
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// Helper function to load the game state
function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        const { currentPage: savedPage, matchedItems: savedMatchedItems } = JSON.parse(savedState);
        currentPage = savedPage || 0;
        currentMatchedItems = new Set(savedMatchedItems || []);
    }
}

// Initialize the game
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const soundColumn = document.getElementById("sound-column");
        const wordColumn = document.getElementById("word-column");
        const paginationContainer = document.getElementById("pagination-container");

        let selectedSoundBox = null;

        // Load the saved state
        loadGameState();

        // Shuffle function to randomize the order
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        // Function to create sound box
        function createSoundBox(soundUrl, index) {
            const soundBox = document.createElement("div");
            soundBox.classList.add("sound-box");
            soundBox.dataset.index = index;
            soundBox.textContent = "Sound " + (index + 1);
            soundBox.setAttribute('aria-label', `Play sound for word ${index + 1}`);
            soundBox.setAttribute('role', 'button');

            if (currentMatchedItems.has(index)) {
                soundBox.classList.add("matched");
            }

            soundBox.addEventListener("click", () => {
                if (soundBox.classList.contains("matched")) return;
                const audio = new Audio(soundUrl);
                audio.play();
                if (selectedSoundBox) {
                    selectedSoundBox.classList.remove("selected");
                }
                selectedSoundBox = soundBox;
                selectedSoundBox.classList.add("selected");
            });

            return soundBox;
        }

        // Function to create word box
        function createWordBox(word, soundIndex) {
            const wordBox = document.createElement("div");
            wordBox.classList.add("word-box");
            wordBox.textContent = word;
            wordBox.dataset.soundIndex = soundIndex;
            wordBox.setAttribute('aria-label', `Match the word: ${word}`);

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

            if (selectedSoundBox && parseInt(selectedSoundBox.dataset.index) === soundIndex) {
                wordBox.classList.add("matched");
                selectedSoundBox.classList.add("matched");
                wordBox.setAttribute('aria-label', `Matched word: ${wordBox.textContent}`);
                selectedSoundBox.setAttribute('aria-label', `Matched sound`);
                currentMatchedItems.add(soundIndex);
                saveGameState(); // Save progress
                selectedSoundBox = null;

                if (currentMatchedItems.size === currentData.length) {
                    alert("You've matched all pairs on this page!");
                    if (currentPage < Math.floor(data.length / dataPerPage)) {
                        currentPage++;
                        saveGameState(); // Save page progress
                        loadPage(currentPage);
                    } else {
                        alert("You've matched all pairs in the game!");
                        resetGame();
                    }
                }
            } else if (selectedSoundBox) {
                selectedSoundBox.classList.remove("selected");
                selectedSoundBox = null;
            }
        }

        // Function to reset the game
        function resetGame() {
            currentPage = 0;
            currentMatchedItems.clear();
            saveGameState(); // Reset progress
            soundColumn.innerHTML = "";
            wordColumn.innerHTML = "";
            loadPage(currentPage);
        }

        // Load data for the current page
        function loadPage(page) {
            soundColumn.innerHTML = "";
            wordColumn.innerHTML = "";
            currentMatchedItems.clear(); // Clear matched items for the new page

            const start = page * dataPerPage;
            const end = start + dataPerPage;
            currentData = data.slice(start, end);

            shuffleArray(currentData); // Shuffle the data

            // Create sound and word boxes
            const soundBoxes = [];
            const wordBoxes = [];

            currentData.forEach((item, index) => {
                soundBoxes.push(createSoundBox(item.sound_url, index));
                wordBoxes.push(createWordBox(item.turkish_meaning, index));
            });

            shuffleArray(soundBoxes); // Shuffle the sound boxes
            shuffleArray(wordBoxes); // Shuffle the word boxes

            // Add shuffled sound and word boxes to their respective columns
            soundBoxes.forEach(box => soundColumn.appendChild(box));
            wordBoxes.forEach(box => wordColumn.appendChild(box));

            updatePaginationButtons();
        }

        // Pagination control
        function updatePaginationButtons() {
            paginationContainer.innerHTML = "";

            const previousButton = document.createElement("button");
            previousButton.textContent = "Previous";
            previousButton.disabled = currentPage === 0;
            previousButton.addEventListener("click", () => {
                currentPage--;
                saveGameState(); // Save page progress
                loadPage(currentPage);
            });

            const nextButton = document.createElement("button");
            nextButton.textContent = "Next";
            nextButton.disabled = currentPage >= Math.floor(data.length / dataPerPage);
            nextButton.addEventListener("click", () => {
                currentPage++;
                saveGameState(); // Save page progress
                loadPage(currentPage);
            });

            paginationContainer.appendChild(previousButton);
            paginationContainer.appendChild(nextButton);
        }

        // Initial load of the current page (from saved state)
        loadPage(currentPage);
    })
    .catch(error => {
        console.error('Error loading the JSON data:', error);
        alert('Failed to load game data. Please try again later.');
    });
