document.addEventListener('DOMContentLoaded', () => {
    const tetrisGame = document.getElementById('tetris-game');
    const playButton = tetrisGame.querySelector('.play-button');
    let canvas, ctx, blockSize, width, height;
    let board, currentPiece, nextPiece;
    let score = 0;
    let gameInterval;
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let isGameRunning = false;

    function initGame() {
        canvas = document.createElement('canvas');
        tetrisGame.innerHTML = '';
        tetrisGame.appendChild(canvas);
        ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = tetrisGame.clientWidth;
        canvas.height = tetrisGame.clientHeight;

        blockSize = Math.floor(canvas.width / 10);
        width = 10;
        height = Math.floor(canvas.height / blockSize);

        board = Array(height).fill().map(() => Array(width).fill(0));
        currentPiece = getRandomPiece();
        nextPiece = getRandomPiece();

        if (isMobile) {
            setupMobileControls();
        } else {
            setupKeyboardControls();
        }

        gameInterval = setInterval(gameLoop, 1000);
        isGameRunning = true;
        draw();
    }

    playButton.addEventListener('click', () => {
        if (!isGameRunning) {
            initGame();
        }
    });

    function getRandomPiece() {
        const pieces = [
            [[1, 1, 1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1, 1], [0, 1, 0]],
            [[1, 1, 1], [1, 0, 0]],
            [[1, 1, 1], [0, 0, 1]],
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1, 1], [1, 1, 0]]
        ];
        return pieces[Math.floor(Math.random() * pieces.length)];
    }

    function setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                    movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                    movePiece(1, 0);
                    break;
                case 'ArrowDown':
                case 's':
                    movePiece(0, 1);
                    break;
                case 'j':
                    rotatePiece();
                    break;
                case ' ':
                    dropPiece();
                    break;
            }
        });
    }

    function setupMobileControls() {
        let touchStartX, touchStartY;

        canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) {
                    movePiece(1, 0);
                } else {
                    movePiece(-1, 0);
                }
            } else if (dy > 0) {
                dropPiece();
            }

            touchStartX = touchEndX;
            touchStartY = touchEndY;
        });

        canvas.addEventListener('click', rotatePiece);
    }

    function movePiece(dx, dy) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        if (collision()) {
            currentPiece.x -= dx;
            currentPiece.y -= dy;
            if (dy > 0) {
                mergePiece();
                clearLines();
                currentPiece = nextPiece;
                nextPiece = getRandomPiece();
                if (collision()) {
                    gameOver();
                }
            }
        }
        draw();
    }

    function rotatePiece() {
        const rotated = currentPiece.shape[0].map((_, i) =>
            currentPiece.shape.map(row => row[i]).reverse()
        );
        const previousShape = currentPiece.shape;
        currentPiece.shape = rotated;
        if (collision()) {
            currentPiece.shape = previousShape;
        }
        draw();
    }

    function dropPiece() {
        while (!collision()) {
            currentPiece.y++;
        }
        currentPiece.y--;
        mergePiece();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = getRandomPiece();
        if (collision()) {
            gameOver();
        }
        draw();
    }

    function collision() {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x] &&
                    (board[y + currentPiece.y] === undefined ||
                        board[y + currentPiece.y][x + currentPiece.x] === undefined ||
                        board[y + currentPiece.y][x + currentPiece.x])) {
                    return true;
                }
            }
        }
        return false;
    }

    function mergePiece() {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    board[y + currentPiece.y][x + currentPiece.x] = 1;
                }
            }
        }
    }

    function clearLines() {
        for (let y = height - 1; y >= 0; y--) {
            if (board[y].every(cell => cell)) {
                board.splice(y, 1);
                board.unshift(Array(width).fill(0));
                score += 100;
            }
        }
    }

    function gameOver() {
        clearInterval(gameInterval);
        alert('游戏结束！得分：' + score);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw board
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (board[y][x]) {
                    drawBlock(x, y);
                }
            }
        }

        // Draw current piece
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    drawBlock(x + currentPiece.x, y + currentPiece.y);
                }
            }
        }

        // Draw score
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText('得分: ' + score, 10, 30);
    }

    function drawBlock(x, y) {
        ctx.fillStyle = '#00F';
        ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
    }

    function gameLoop() {
        movePiece(0, 1);
    }

    initGame();
});