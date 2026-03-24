document.addEventListener("DOMContentLoaded", () => {
    const mode = document.body.dataset.mode;

    let board = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let gameActive = true;
    let isAiThinking = false;
    let difficulty = "easy";

    const scores = {
        local: { X: 0, O: 0 },
        ai: { X: 0, O: 0 },
        online: { X: 0, O: 0 }
    };

    const cells = document.querySelectorAll(".cell");
    const statusText = document.getElementById("status");

    updateScoreboard();
    updateStatus();

    // --- Cell click handling ---
    cells.forEach(cell => {
        cell.addEventListener("click", handleClick);
    });

    function handleClick(e) {
        const index = e.target.dataset.index;

        if (board[index] !== "" || !gameActive || isAiThinking) return;

        if (mode === "online") {
            if (!gameId) return alert("No room joined yet!");
            socket.emit("playerMove", { gameId, move: index });
        } else {
            makeMove(index, currentPlayer);

            if (gameActive) {
                switchPlayer();

                if (mode === "ai" && currentPlayer === "O") {
                    if (difficulty === "easy") {
                        aiMoveEasy();
                    } else {
                        aiMoveBackend();
                    }
                }
            }
        }
    }

    function makeMove(index, player) {
        board[index] = player;
        cells[index].classList.add(player.toLowerCase());
        cells[index].classList.add("pop");
        checkWinner();
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateStatus();
    }

    function updateStatus() {
        if (mode === "ai" && currentPlayer === "O") {
            statusText.innerText = "AI's Turn 🤖";
        } else {
            statusText.innerText = `Player ${currentPlayer}'s Turn`;
        }

        updateTurnUI(currentPlayer);
    }

    const winPatterns = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    function checkWinner() {
        for (let pattern of winPatterns) {
            let [a,b,c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                gameActive = false;
                statusText.innerText = `Player ${board[a]} Wins!`;
                scores[mode][board[a]]++;
                updateScoreboard();
                highlightWin(pattern);
                setTimeout(resetBoard, 1500);
                return;
            }
        }
        if (!board.includes("")) {
            gameActive = false;
            statusText.innerText = "It's a Draw!";
            setTimeout(resetBoard, 1500);
        }
    }

    function highlightWin(pattern) {
        pattern.forEach(i => cells[i].classList.add("win"));
    }

    function updateScoreboard() {
        const x = document.getElementById("scoreX");
        const o = document.getElementById("scoreO");
        if (x && o) {
            x.innerText = scores[mode].X;
            o.innerText = scores[mode].O;
        }
    }

    function resetBoard() {
        board = ["", "", "", "", "", "", "", "", ""];
        currentPlayer = "X";
        gameActive = true;
        cells.forEach(cell => cell.classList.remove("x", "o", "win"));
        updateStatus();
    }

    function updateTurnUI(player) {
        statusText.classList.remove("x-turn", "o-turn");
        statusText.classList.add(player === "X" ? "x-turn" : "o-turn");
    }

    window.goBack = function () {
        window.location.href = "index.html";
    };

    function aiMoveBackend() {
        isAiThinking = true;
        statusText.innerText = "AI is thinking... 🤖";

        // Add delay so it feels natural
        setTimeout(() => {
            fetch("http://127.0.0.1:5000/ai-move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ board })
            })
            .then(res => res.json())
            .then(data => {
                if (data.move !== undefined) {
                    makeMove(data.move, "O");
                } else {
                    fallbackAiMove();
                }

                if (gameActive) switchPlayer();
                isAiThinking = false;
            })
            .catch(err => {
                console.error("AI error:", err);
                fallbackAiMove();
                if (gameActive) switchPlayer();
                isAiThinking = false;
            });
        }, 500); // delay = better UX
    }

    function fallbackAiMove() {
        let emptyCells = board
            .map((val, i) => val === "" ? i : null)
            .filter(v => v !== null);

        if (emptyCells.length === 0) return;

        let randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        makeMove(randomIndex, "O");
    }

    // --- ONLINE MULTIPLAYER SETUP ---
    let socket, gameId, username;

    if (mode === "online") {
        socket = io("http://127.0.0.1:5000");
        username = prompt("Enter your name") || "Player";

        // Buttons for room creation / joining
        const createBtn = document.getElementById("createRoomBtn");
        const joinBtn = document.getElementById("joinRoomBtn");
        const roomDisplay = document.getElementById("roomDisplay");
        const roomInput = document.getElementById("roomInput");

        const generateRoomId = () => Math.random().toString(36).substring(2, 8);

        createBtn.addEventListener("click", () => {
            gameId = generateRoomId();
            socket.emit("joinGame", { username, gameId });
            roomDisplay.innerText = `Room ID: ${gameId}`;
        });

        joinBtn.addEventListener("click", () => {
            const id = roomInput.value.trim();
            if (id) {
                gameId = id;
                socket.emit("joinGame", { username, gameId });
            }
        });

        // Socket listeners
        socket.on("gameUpdate", data => {
            board = data.board;
            currentPlayer = data.currentPlayer;
            gameActive = data.gameActive;
            updateUI();
        });

        socket.on("gameOver", data => {
            gameActive = false;
            statusText.innerText = data.message;
            setTimeout(resetBoard, 1500);
        });

        socket.on("roomFull", () => alert("This room already has 2 players."));
    }

    function updateUI() {
        cells.forEach((cell, i) => {
            cell.classList.remove("x", "o", "win");
            if (board[i]) cell.classList.add(board[i].toLowerCase());
        });
        updateStatus();
    }

    function aiMoveEasy() {
        isAiThinking = true;
        statusText.innerText = "AI (Easy) thinking... 🤖";

        setTimeout(() => {
            let emptyCells = board
                .map((val, i) => val === "" ? i : null)
                .filter(v => v !== null);

            let move = emptyCells[Math.floor(Math.random() * emptyCells.length)];

            makeMove(move, "O");

            if (gameActive) switchPlayer();
            isAiThinking = false;
        }, 400);
    }

    window.setDifficulty = function (level, btn) {
        difficulty = level;
        resetBoard();

        document.querySelectorAll(".diff-btn")
            .forEach(b => b.classList.remove("active"));

        if (btn) btn.classList.add("active");

        statusText.innerText = `AI Mode (${level.toUpperCase()})`;
    };
});