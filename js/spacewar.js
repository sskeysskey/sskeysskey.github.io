document.addEventListener('DOMContentLoaded', () => {
    const spacewarGame = document.getElementById('spacewar-game');
    const playButton = spacewarGame.querySelector('.play-button');
    let canvas, ctx, player, enemies, bullets, score;
    let gameLoop, enemyInterval;
    let isGameRunning = false;
    let images = {};
    let isMobile = false;
    let backgroundY = 0;
    const backgroundSpeed = 1;
    const IMAGE_PATH = 'images/game/';  // 新增：定义图片路径

    // 修改预加载图片函数
    function loadImages() {
        const imageNames = ['background', 'enemy', 'player_bullet', 'player'];
        const loadPromises = imageNames.map(name => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ name, img });
                img.onerror = reject;
                img.src = `${IMAGE_PATH}${name}.png`;  // 修改：使用新的图片路径
            });
        });

        return Promise.all(loadPromises).then(loadedImages => {
            loadedImages.forEach(({ name, img }) => {
                images[name] = img;
            });
        });
    }

    function initGame() {
        playButton.style.display = 'none';
        canvas = document.createElement('canvas');
        spacewarGame.innerHTML = '';
        spacewarGame.appendChild(canvas);
        ctx = canvas.getContext('2d');

        // 检测是否为移动设备
        isMobile = window.matchMedia("(max-width: 768px)").matches;

        if (isMobile) {
            // 移动设备上使用窄高型布局
            const aspectRatio = 9 / 16;
            canvas.width = spacewarGame.clientWidth;
            canvas.height = canvas.width / aspectRatio;

            // 确保 canvas 不会超出屏幕高度
            if (canvas.height > window.innerHeight) {
                canvas.height = window.innerHeight;
                canvas.width = canvas.height * aspectRatio;
            }
        } else {
            // 桌面设备上使用更宽的布局
            const aspectRatio = 4 / 3;
            canvas.width = Math.min(spacewarGame.clientWidth, window.innerWidth * 0.8);
            canvas.height = canvas.width / aspectRatio;
        }

        // 调整游戏元素大小和位置
        adjustGameElements();

        player = {
            x: canvas.width / 2 - 25, // 调整初始位置
            y: canvas.height - 70,
            width: 50,
            height: 50,
            speed: canvas.height / 100 // 根据画布高度调整速度
        };

        enemies = [];
        bullets = [];
        score = 0;

        if (isMobile) {
            setupMobileControls();
        } else {
            setupKeyboardControls();
        }

        gameLoop = requestAnimationFrame(update);
        enemyInterval = setInterval(spawnEnemy, 2000);
        isGameRunning = true;
    }

    function adjustGameElements() {
        const scaleFactor = canvas.width / 800; // 假设原始设计基于 800px 宽度

        player = {
            x: canvas.width / 2 - 25 * scaleFactor,
            y: canvas.height - 70 * scaleFactor,
            width: 50 * scaleFactor,
            height: 50 * scaleFactor,
            speed: 5 * scaleFactor
        };

        // 调整子弹大小和速度的函数
        fireBullet = () => {
            const bullet = {
                x: player.x + player.width / 2 - 2.5 * scaleFactor,
                y: player.y,
                width: 5 * scaleFactor,
                height: 15 * scaleFactor,
                speed: 7 * scaleFactor
            };
            bullets.push(bullet);
        };

        // 调整敌人生成函数
        spawnEnemy = () => {
            const enemy = {
                x: Math.random() * (canvas.width - 50 * scaleFactor),
                y: -50 * scaleFactor,
                width: 50 * scaleFactor,
                height: 50 * scaleFactor,
                speed: (2 + Math.random() * 2) * scaleFactor
            };
            enemies.push(enemy);
        };
    }

    playButton.addEventListener('click', () => {
        if (!isGameRunning) {
            loadImages().then(() => {
                initGame();
                playButton.style.display = 'none';
            });
        }
    });

    // 添加窗口大小变化监听
    window.addEventListener('resize', () => {
        initGame();
        if (!isGameRunning) {
            gameOver();
        }
    });

    function setupKeyboardControls() {
        const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, KeyA: false, KeyD: false, KeyW: false, KeyS: false };

        document.addEventListener('keydown', (e) => {
            if (keys.hasOwnProperty(e.code)) {
                keys[e.code] = true;
            } else if (e.code === 'Space' || e.code === 'KeyJ') {
                fireBullet();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (keys.hasOwnProperty(e.code)) {
                keys[e.code] = false;
            }
        });

        function updatePlayerPosition() {
            if (keys.ArrowLeft || keys.KeyA) player.x -= player.speed;
            if (keys.ArrowRight || keys.KeyD) player.x += player.speed;
            if (keys.ArrowUp || keys.KeyW) player.y -= player.speed;
            if (keys.ArrowDown || keys.KeyS) player.y += player.speed;

            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
            player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
        }

        return updatePlayerPosition;
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

            player.x += (touchEndX - touchStartX) * 1.5;  // 提高灵敏度
            player.y += (touchEndY - touchStartY) * 1.5;

            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
            player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

            touchStartX = touchEndX;
            touchStartY = touchEndY;
        });

        return () => { };  // 移动设备不需要额外的更新函数
    }

    function spawnEnemy() {
        const enemy = {
            x: Math.random() * (canvas.width - player.width),  // 敌机生成位置
            y: -player.height,  // 敌机从画布顶端生成
            width: player.width,  // 敌机宽度与玩家一致
            height: player.height,  // 敌机高度与玩家一致
            speed: player.speed * (1 + Math.random() * 0.5)  // 敌机速度与玩家速度保持相似，增加一点随机性
        };
        enemies.push(enemy);
    }

    // 在 fireBullet 函数中调整子弹的大小和速度
    function fireBullet() {
        const bullet = {
            x: player.x + player.width / 2 - canvas.width / 200,
            y: player.y,
            width: canvas.width / 100,
            height: canvas.height / 40,
            speed: canvas.height / 50 // 根据画布高度调整速度
        };
        bullets.push(bullet);
    }

    function update() {
        // 更新背景位置
        backgroundY = (backgroundY + backgroundSpeed) % canvas.height;

        // 绘制滚动背景
        ctx.drawImage(images.background, 0, backgroundY, canvas.width, canvas.height);
        ctx.drawImage(images.background, 0, backgroundY - canvas.height, canvas.width, canvas.height);

        updatePlayerPosition();
        drawPlayer();

        enemies.forEach((enemy, index) => {
            enemy.y += enemy.speed;
            drawEnemy(enemy);

            if (enemy.y > canvas.height) {
                enemies.splice(index, 1);
            }

            if (collision(player, enemy)) {
                gameOver();
                return;
            }
        });

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

        drawScore();

        if (isMobile && Math.random() < 0.1) {
            fireBullet();
        }

        if (isGameRunning) {
            gameLoop = requestAnimationFrame(update);
        }
    }

    function drawPlayer() {
        ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
    }

    function drawEnemy(enemy) {
        ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
    }

    function drawBullet(bullet) {
        ctx.drawImage(images.player_bullet, bullet.x, bullet.y, bullet.width, bullet.height);
    }

    function drawScore() {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('得分: ' + score, 10, 30);
    }

    function collision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    function gameOver() {
        cancelAnimationFrame(gameLoop);
        clearInterval(enemyInterval);
        isGameRunning = false;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('游戏结束', canvas.width / 2 - 80, canvas.height / 2);
        ctx.font = 'bold 20px Arial';
    }

    const updatePlayerPosition = isMobile ? setupMobileControls() : setupKeyboardControls();
});