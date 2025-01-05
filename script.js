// Global variables for pagination
let currentPage = 0;
let dataPerPage = 10;
let currentData = [];

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const soundColumn = document.getElementById("sound-column");
        const wordColumn = document.getElementById("word-column");
        const paginationContainer = document.getElementById("pagination-container");

        let selectedSoundBox = null;
        let matchedPairs = 0;

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

            wordBox.addEventListener("click", () => {
                if (wordBox.classList.contains("matched")) return;

                if (selectedSoundBox && parseInt(selectedSoundBox.dataset.index) === soundIndex) {
                    wordBox.classList.add("matched");
                    selectedSoundBox.classList.add("matched");
                    wordBox.removeEventListener("click", arguments.callee);
                    selectedSoundBox.removeEventListener("click", arguments.callee);
                    matchedPairs++;
                    selectedSoundBox = null;

                    if (matchedPairs === currentData.length) {
                        alert("You've matched all pairs on this page!");
                        if (currentPage < Math.floor(data.length / dataPerPage)) {
                            currentPage++;
                            loadPage(currentPage);
                        }
                    }
                } else if (selectedSoundBox) {
                    selectedSoundBox.classList.remove("selected");
                    selectedSoundBox = null;
                }
            });

            return wordBox;
        }

        // Load data for the current page
        function loadPage(page) {
            soundColumn.innerHTML = "";
            wordColumn.innerHTML = "";
            matchedPairs = 0;

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
                loadPage(currentPage);
            });

            const nextButton = document.createElement("button");
            nextButton.textContent = "Next";
            nextButton.disabled = currentPage >= Math.floor(data.length / dataPerPage);
            nextButton.addEventListener("click", () => {
                currentPage++;
                loadPage(currentPage);
            });

            paginationContainer.appendChild(previousButton);
            paginationContainer.appendChild(nextButton);
        }

        // Initial load of the first page
        loadPage(currentPage);
    })
    .catch(error => console.error('Error loading the JSON data:', error));
