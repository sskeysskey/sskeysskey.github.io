document.addEventListener('DOMContentLoaded', () => {
    const spaceShooterGame = document.getElementById('space-shooter-game');
    const playButton = spaceShooterGame.querySelector('.play-button');
    let canvas, ctx, player, enemies, bullets, score;
    let gameLoop, enemyInterval;
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let isGameRunning = false;

    function initGame() {
        canvas = document.createElement('canvas');
        spaceShooterGame.innerHTML = '';
        spaceShooterGame.appendChild(canvas);
        ctx = canvas.getContext('2d');

        canvas.width = spaceShooterGame.clientWidth;
        canvas.height = spaceShooterGame.clientHeight;

        player = {
            x: canvas.width / 2,
            y: canvas.height - 30,
            width: 30,
            height: 30,
            speed: 5
        };

        enemies = [];
        bullets = [];
        score = 0;

        if (isMobile) {
            setupMobileControls();
        } else {
            setupKeyboardControls();
        }

        gameLoop = setInterval(update, 1000 / 60);
        enemyInterval = setInterval(spawnEnemy, 2000);
        isGameRunning = true;
    }

    playButton.addEventListener('click', () => {
        if (!isGameRunning) {
            initGame();
            playButton.style.display = 'none'; // 隐藏开始按钮
        }
    });

    function setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                    player.x -= player.speed;
                    break;
                case 'ArrowRight':
                case 'd':
                    player.x += player.speed;
                    break;
                case 'ArrowUp':
                case 'w':
                    player.y -= player.speed;
                    break;
                case 'ArrowDown':
                case 's':
                    player.y += player.speed;
                    break;
                case 'j':
                    fireBullet();
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

            player.x += touchEndX - touchStartX;
            player.y += touchEndY - touchStartY;

            touchStartX = touchEndX;
            touchStartY = touchEndY;
        });
    }

    function spawnEnemy() {
        const enemy = {
            x: Math.random() * (canvas.width - 30),
            y: 0,
            width: 30,
            height: 30,
            speed: 2
        };
        enemies.push(enemy);
    }

    function fireBullet() {
        const bullet = {
            x: player.x + player.width / 2,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7
        };
        bullets.push(bullet);
    }

    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw player
        drawPlayer();

        // Update and draw enemies
        enemies.forEach((enemy, index) => {
            enemy.y += enemy.speed;
            drawEnemy(enemy);

            if (enemy.y > canvas.height) {
                enemies.splice(index, 1);
            }

            if (collision(player, enemy)) {
                gameOver();
            }
        });

        // Update and draw bullets
        bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            drawBullet(bullet);

            if (bullet.y < 0) {
                bullets.splice(index, 1);
            }

            enemies.forEach((enemy, enemyIndex) => {
                if (collision(bullet, enemy)) {
                    bullets.splice(index, 1);
                    enemies.splice(enemyIndex, 1);
                    score += 10;
                }
            });
        });

        // Draw score
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText('得分: ' + score, 10, 30);

        if (isMobile) {
            fireBullet();
        }
    }

    function drawPlayer() {
        ctx.fillStyle = '#00F';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawEnemy(enemy) {
        ctx.fillStyle = '#F00';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }

    function drawBullet(bullet) {
        ctx.fillStyle = '#0F0';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    function collision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    function gameOver() {
        clearInterval(gameLoop);
        clearInterval(enemyInterval);
        isGameRunning = false;
        playButton.style.display = 'block'; // 重新显示开始按钮
    }
});