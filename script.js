const sounds = {
    backgroundMusic: new Audio('sounds/background music.mp3'),
    victory: new Audio('sounds/victory.mp3'),
    defeat: new Audio('sounds/defeat.mp3'),
    explosion: new Audio('sounds/explosion.mp3')
};
const imagesToPreload = [
    'assets/soil background.png', 
    'assets/player.png', 
    'assets/bot.png', 
    'assets/player fire.png', 
    'assets/bot fire.png', 
    'assets/empty bar.png', 
    'assets/full bar.png', 
    'assets/Barrel_01.png', 
    'assets/Bush.png', 
    'assets/menu large.png', 
    'assets/menu.png', 
    'assets/Button BG.png', 
    'assets/green.png', 
    'assets/red.png'
];
const preloadedImages = {};
imagesToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
    preloadedImages[src] = img;
});
function waitForImages() {
    return Promise.all(imagesToPreload.map(src => {
        return new Promise(resolve => {
            if (preloadedImages[src].complete) {
                resolve();
            } else {
                preloadedImages[src].onload = resolve;
            }
        });
    }));
}
sounds.backgroundMusic.loop = true;
function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}
const player = {
    element: document.getElementById('player'),
    direction: document.getElementById('playerDirection'),
    health: 150,
    x: window.innerWidth * 0.1,
    y: window.innerHeight * 0.5,
    speed: 5.5,
    damage: 5,
    frozen: false,
    angle: 0,
    chargeStart: 0,
    isCharging: false,
    lastShot: 0
};
const bot = {
    element: document.getElementById('bot'),
    direction: document.getElementById('botDirection'),
    health: 150,
    x: window.innerWidth * 0.9,
    y: window.innerHeight * 0.5,
    speed: 3.3,
    damage: 5,
    frozen: false,
    angle: 180,
    chargeStart: 0,
    isCharging: false,
    lastShot: 0
};
const gameState = {
    keys: {},
    bullets: [],
    powerups: [],
    gameOver: false,
    gameStarted: false
};
const obstacles = {
    barrels: [],
    bushes: []
};
const mainMenu = document.getElementById('mainMenu');
const instructionsMenu = document.getElementById('instructionsMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const playButton = document.getElementById('playButton');
const instructionsButton = document.getElementById('instructionsButton');
const backButton = document.getElementById('backButton');
const playAgainButton = document.getElementById('playAgainButton');
const winnerText = document.getElementById('winnerText');
mainMenu.style.display = 'block';
document.addEventListener('keydown', e => {
    gameState.keys[e.key] = true;
    if (e.key === ' ' && !gameState.gameOver && !player.isCharging) {
        player.isCharging = true;
        player.chargeStart = Date.now();
        const chargeBar = player.element.querySelector('.charge-bar');
        const chargeFill = chargeBar.querySelector('.charge-fill');
        if (player.element === document.getElementById('player')) {
            chargeBar.style.display = 'block';
            let chargeInterval = setInterval(() => {
                const chargeTime = Date.now() - player.chargeStart;
                const chargePercent = Math.min(chargeTime / 5000 * 100, 100);
                chargeFill.style.width = chargePercent + '%';
                if (chargeTime >= 5000 || !player.isCharging) {
                    clearInterval(chargeInterval);
                }
            }, 50);
        }
    }
});
document.addEventListener('keyup', e => {
    gameState.keys[e.key] = false;
    if (e.key === ' ' && !gameState.gameOver) {
        const chargeTime = Date.now() - player.chargeStart;
        const chargeBar = player.element.querySelector('.charge-bar');
        const chargeFill = chargeBar.querySelector('.charge-fill');
        chargeBar.style.display = 'none';
        chargeFill.style.width = '0%';
        player.isCharging = false;
        if (chargeTime >= 5000) {
            shoot(player, true, true);
        } else {
            shoot(player, true, false);
        }
    }
});
document.addEventListener('keypress', e => {
    if (e.key === 'Enter' && gameState.gameOver) {
        startGame();
    }
});
playButton.addEventListener('click', startGame);
instructionsButton.addEventListener('click', showInstructions);
backButton.addEventListener('click', showMainMenu);
playAgainButton.addEventListener('click', startGame);
function showInstructions() {
    mainMenu.style.display = 'none';
    instructionsMenu.style.display = 'block';
}
function showMainMenu() {
    instructionsMenu.style.display = 'none';
    mainMenu.style.display = 'block';
}
async function startGame() {
    await waitForImages();
    sounds.backgroundMusic.play().catch(error => {
        console.log("Audio playback failed:", error);
    });
    mainMenu.style.display = 'none';
    instructionsMenu.style.display = 'none';
    gameOverMenu.style.display = 'none';
    gameState.gameOver = false;
    gameState.gameStarted = true;
    document.getElementById('gameOver').style.display = 'none';
    player.health = 150;
    player.x = window.innerWidth * 0.1;
    player.y = window.innerHeight * 0.5;
    player.frozen = false;
    player.damage = 5;
    player.lastShot = 0;
    player.element.classList.remove('frozen');
    bot.health = 150;
    bot.x = window.innerWidth * 0.9;
    bot.y = window.innerHeight * 0.5;
    bot.frozen = false;
    bot.damage = 5;
    bot.lastShot = 0;
    bot.element.classList.remove('frozen');
    gameState.bullets.forEach(bullet => bullet.element.remove());
    gameState.bullets = [];
    gameState.powerups.forEach(powerup => powerup.element.remove());
    gameState.powerups = [];
    obstacles.barrels.forEach(barrel => barrel.element.remove());
    obstacles.barrels = [];
    obstacles.bushes.forEach(bush => bush.element.remove());
    obstacles.bushes = [];
    const playerAreaStart = 0;
    const playerAreaEnd = window.innerWidth * 0.25;
    const botAreaStart = window.innerWidth * 0.75;
    const botAreaEnd = window.innerWidth;
    const midAreaStart = window.innerWidth * 0.25;
    const midAreaEnd = window.innerWidth * 0.75;
    const midAreaWidth = midAreaEnd - midAreaStart;
    const numMidBarrels = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numMidBarrels; i++) {
        const barrel = document.createElement('div');
        barrel.style.position = 'absolute';
        barrel.style.width = '50px';
        barrel.style.height = '50px';
        barrel.style.backgroundImage = "url('assets/Barrel_01.png')";
        barrel.style.backgroundSize = 'contain';
        barrel.style.backgroundRepeat = 'no-repeat';
        barrel.style.backgroundPosition = 'center';
        let x, y;
        do {
            x = midAreaStart + Math.random() * midAreaWidth;
            y = 50 + Math.random() * (window.innerHeight - 100);
        } while (Math.abs(y - window.innerHeight / 2) < 100);
        barrel.style.left = x + 'px';
        barrel.style.top = y + 'px';
        document.getElementById('gameArea').appendChild(barrel);
        obstacles.barrels.push({
            element: barrel,
            x: x,
            y: y,
            health: 3
        });
    }
    const numSideBarrels = 1;
    for (let i = 0; i < numSideBarrels; i++) {
        const playerBarrel = document.createElement('div');
        playerBarrel.style.position = 'absolute';
        playerBarrel.style.width = '50px';
        playerBarrel.style.height = '50px';
        playerBarrel.style.backgroundImage = "url('assets/Barrel_01.png')";
        playerBarrel.style.backgroundSize = 'contain';
        playerBarrel.style.backgroundRepeat = 'no-repeat';
        playerBarrel.style.backgroundPosition = 'center';
        let playerX, playerY;
        do {
            playerX = playerAreaStart + Math.random() * playerAreaEnd;
            playerY = 50 + Math.random() * (window.innerHeight - 100);
        } while (Math.abs(playerY - window.innerHeight / 2) < 100);
        playerBarrel.style.left = playerX + 'px';
        playerBarrel.style.top = playerY + 'px';
        document.getElementById('gameArea').appendChild(playerBarrel);
        obstacles.barrels.push({
            element: playerBarrel,
            x: playerX,
            y: playerY,
            health: 3
        });
        const botBarrel = document.createElement('div');
        botBarrel.style.position = 'absolute';
        botBarrel.style.width = '50px';
        botBarrel.style.height = '50px';
        botBarrel.style.backgroundImage = "url('assets/Barrel_01.png')";
        botBarrel.style.backgroundSize = 'contain';
        botBarrel.style.backgroundRepeat = 'no-repeat';
        botBarrel.style.backgroundPosition = 'center';
        let botX, botY;
        do {
            botX = botAreaStart + Math.random() * (botAreaEnd - botAreaStart);
            botY = 50 + Math.random() * (window.innerHeight - 100);
        } while (Math.abs(botY - window.innerHeight / 2) < 100);
        botBarrel.style.left = botX + 'px';
        botBarrel.style.top = botY + 'px';
        document.getElementById('gameArea').appendChild(botBarrel);
        obstacles.barrels.push({
            element: botBarrel,
            x: botX,
            y: botY,
            health: 3
        });
    }
    const numSideBushes = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numSideBushes; i++) {
        const playerBush = document.createElement('div');
        playerBush.style.position = 'absolute';
        playerBush.style.width = '60px';
        playerBush.style.height = '60px';
        playerBush.style.backgroundImage = "url('assets/Bush.png')";
        playerBush.style.backgroundSize = 'contain';
        playerBush.style.backgroundRepeat = 'no-repeat';
        playerBush.style.backgroundPosition = 'center';
        playerBush.style.zIndex = '1';
        let playerX = playerAreaStart + Math.random() * playerAreaEnd;
        let playerY = 50 + Math.random() * (window.innerHeight - 100);
        playerBush.style.left = playerX + 'px';
        playerBush.style.top = playerY + 'px';
        document.getElementById('gameArea').appendChild(playerBush);
        obstacles.bushes.push({
            element: playerBush,
            x: playerX,
            y: playerY
        });
        const botBush = document.createElement('div');
        botBush.style.position = 'absolute';
        botBush.style.width = '60px';
        botBush.style.height = '60px';
        botBush.style.backgroundImage = "url('assets/Bush.png')";
        botBush.style.backgroundSize = 'contain';
        botBush.style.backgroundRepeat = 'no-repeat';
        botBush.style.backgroundPosition = 'center';
        botBush.style.zIndex = '1';
        let botX = botAreaStart + Math.random() * (botAreaEnd - botAreaStart);
        let botY = 50 + Math.random() * (window.innerHeight - 100);
        botBush.style.left = botX + 'px';
        botBush.style.top = botY + 'px';
        document.getElementById('gameArea').appendChild(botBush);
        obstacles.bushes.push({
            element: botBush,
            x: botX,
            y: botY
        });
    }
    document.querySelectorAll('.charge-bar').forEach(bar => {
        bar.style.display = 'none';
        bar.querySelector('.charge-fill').style.width = '0%';
    });
    updateHealthBars();
    gameLoop();
}
function endGame(message) {
    gameState.gameOver = true;
    winnerText.textContent = message;
    gameOverMenu.style.display = 'block';
    sounds.backgroundMusic.pause();
    sounds.backgroundMusic.currentTime = 0;
    if (message === 'Player Wins!') {
        sounds.victory.currentTime = 0;
        sounds.victory.play().catch(error => {
            console.log("Audio playback failed:", error);
        });
    } else {
        sounds.defeat.currentTime = 0;
        sounds.defeat.play().catch(error => {
            console.log("Audio playback failed:", error);
        });
    }
}
function shoot(character, isPlayer, isPlasma = false) {
    if (!gameState.gameStarted) return;
    if (!isPlasma) {
        const now = Date.now();
        if (now - character.lastShot < 350) {
            return;
        }
        character.lastShot = now;
    }
    const bullet = document.createElement('div');
    bullet.className = `bullet ${isPlayer ? 'player-bullet' : 'bot-bullet'}`;
    if (isPlasma) {
        bullet.classList.add('plasma-bullet');
    }
    const angle = character.angle * (Math.PI / 180);
    const startX = character.x + Math.cos(angle) * 40;
    const startY = character.y + Math.sin(angle) * 40;
    bullet.style.left = startX + 'px';
    bullet.style.top = startY + 'px';
    document.getElementById('gameArea').appendChild(bullet);
    const damage = isPlasma ? character.damage * 1.6 : character.damage;
    gameState.bullets.push({
        element: bullet,
        x: startX,
        y: startY,
        angle: angle,
        isPlayer: isPlayer,
        damage: damage,
        isPlasma: isPlasma
    });
}
function spawnPowerup() {
    if (gameState.powerups.length < 2 && Math.random() < 0.3) {
        const powerup = document.createElement('div');
        powerup.className = 'powerup';
        const type = Math.floor(Math.random() * 2);
        if (type === 0) {
            powerup.style.backgroundImage = "url('assets/red.png')";
        } else {
            powerup.style.backgroundImage = "url('assets/green.png')";
        }
        const side = Math.random() < 0.5;
        let x;
        if (side) {
            x = Math.random() * (window.innerWidth * 0.25);
        } else {
            x = window.innerWidth * 0.75 + Math.random() * (window.innerWidth * 0.25);
        }
        const y = Math.random() * window.innerHeight;
        powerup.style.left = x + 'px';
        powerup.style.top = y + 'px';
        document.getElementById('gameArea').appendChild(powerup);
        gameState.powerups.push({
            element: powerup,
            type: type,
            x: x,
            y: y
        });
    }
}
function applyPowerup(character, type) {
    switch (type) {
        case 0:
            const opponent = character === player ? bot : player;
            opponent.frozen = true;
            opponent.element.classList.add('frozen');
            setTimeout(() => {
                opponent.frozen = false;
                opponent.element.classList.remove('frozen');
            }, 3000);
            break;
        case 1:
            character.health = Math.min(150, character.health + 30);
            updateHealthBars();
            break;
    }
}
function updateHealthBars() {
    document.querySelector('#playerHealth .health-fill').style.width = player.health / 150 * 100 + '%';
    document.querySelector('#botHealth .health-fill').style.width = bot.health / 150 * 100 + '%';
}
function updateCharacterPosition(character) {
    character.element.style.left = character.x + 'px';
    character.element.style.top = character.y + 'px';
    character.direction.style.transform = `rotate(${character.angle}deg)`;
}
function botAI() {
    if (bot.frozen || !gameState.gameStarted) return;
    let moveY = 0;
    let moveX = 0;
    const nearbyBullets = gameState.bullets.filter(bullet => bullet.isPlayer && getDistance(bot.x, bot.y, bullet.x, bullet.y) < 150 && bullet.x < bot.x);
    if (nearbyBullets.length > 0) {
        if (bot.isCharging) {
            bot.isCharging = false;
        }
        const closestBullet = nearbyBullets.reduce((closest, bullet) => {
            const distance = getDistance(bot.x, bot.y, bullet.x, bullet.y);
            return distance < closest.distance ? {
                bullet,
                distance
            } : closest;
        }, {
            bullet: null,
            distance: Infinity
        }).bullet;
        if (closestBullet) {
            if (closestBullet.y > bot.y) {
                moveY = -bot.speed;
            } else {
                moveY = bot.speed;
            }
        }
    } else {
        const nearbyPowerups = gameState.powerups.filter(powerup => getDistance(bot.x, bot.y, powerup.x, powerup.y) < 300);
        if (nearbyPowerups.length > 0) {
            if (bot.isCharging) {
                bot.isCharging = false;
            }
            const closestPowerup = nearbyPowerups.reduce((closest, powerup) => {
                const distance = getDistance(bot.x, bot.y, powerup.x, powerup.y);
                return distance < closest.distance ? {
                    powerup,
                    distance
                } : closest;
            }, {
                powerup: null,
                distance: Infinity
            }).powerup;
            if (closestPowerup) {
                if (Math.abs(bot.y - closestPowerup.y) > bot.speed) {
                    moveY = closestPowerup.y > bot.y ? bot.speed : -bot.speed;
                }
                if (Math.abs(bot.x - closestPowerup.x) > bot.speed) {
                    moveX = closestPowerup.x > bot.x ? bot.speed : -bot.speed;
                }
            }
        } else {
            const targetY = player.y;
            if (Math.abs(bot.y - targetY) > bot.speed) {
                if (bot.isCharging) {
                    bot.isCharging = false;
                }
                moveY = bot.y < targetY ? bot.speed : -bot.speed;
            }
            if (Math.random() < 0.05) {
                if (bot.isCharging) {
                    bot.isCharging = false;
                }
                moveX = (Math.random() - 0.5) * bot.speed * 2;
            }
            if (Math.abs(moveX) < 0.1 && Math.abs(moveY) < 0.1) {
                if (Math.abs(bot.y - player.y) < 50) {
                    if (!bot.isCharging && Math.random() < 0.05) {
                        bot.isCharging = true;
                        bot.chargeStart = Date.now();
                    }
                }
            }
        }
        if (bot.isCharging && Date.now() - bot.chargeStart >= 5000) {
            bot.isCharging = false;
            shoot(bot, false, true);
        }
        if (!bot.isCharging && Math.abs(bot.y - player.y) < 50 && Math.random() < 0.1) {
            const now = Date.now();
            if (now - bot.lastShot >= 350) {
                shoot(bot, false, false);
            }
        }
    }
    bot.x += moveX;
    bot.y += moveY;
    bot.x = Math.max(window.innerWidth * 0.75, Math.min(window.innerWidth - 20, bot.x));
    bot.y = Math.max(20, Math.min(window.innerHeight - 20, bot.y));
    updateCharacterPosition(bot);
}
function checkGameOver() {
    if (player.health <= 0) {
        endGame('Bot Wins!');
    } else if (bot.health <= 0) {
        endGame('Player Wins!');
    }
}
function gameLoop() {
    if (gameState.gameOver) return;
    if (!player.frozen) {
        let moveX = 0;
        let moveY = 0;
        if (gameState.keys['ArrowUp']) {
            moveY = -player.speed;
        } else if (gameState.keys['ArrowDown']) {
            moveY = player.speed;
        }
        if (!gameState.keys['ArrowUp'] && !gameState.keys['ArrowDown']) {
            if (gameState.keys['ArrowLeft']) {
                moveX = -player.speed;
            } else if (gameState.keys['ArrowRight']) {
                moveX = player.speed;
            }
        }
        player.x += moveX;
        player.y += moveY;
        player.x = Math.max(0, Math.min(window.innerWidth * 0.25, player.x));
        player.y = Math.max(0, Math.min(window.innerHeight, player.y));
        updateCharacterPosition(player);
    }
    botAI();
    gameState.bullets.forEach((bullet, index) => {
        bullet.x += Math.cos(bullet.angle) * 11;
        bullet.y += Math.sin(bullet.angle) * 11;
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
        let bulletBlocked = false;
        obstacles.bushes.forEach((bush, bushIndex) => {
            const dx = bullet.x - (bush.x + 30);
            const dy = bullet.y - (bush.y + 30);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 35) {
                bullet.element.remove();
                gameState.bullets.splice(index, 1);
                bush.element.remove();
                obstacles.bushes.splice(bushIndex, 1);
                bulletBlocked = true;
                return;
            }
        });
        if (bulletBlocked) return;
        obstacles.barrels.forEach((barrel, barrelIndex) => {
            const dx = bullet.x - (barrel.x + 25);
            const dy = bullet.y - (barrel.y + 25);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 30) {
                bullet.element.remove();
                gameState.bullets.splice(index, 1);
                barrel.health--;
                if (barrel.health <= 0) {
                    const explosion = document.createElement('div');
                    explosion.style.position = 'absolute';
                    explosion.style.width = '100px';
                    explosion.style.height = '100px';
                    explosion.style.left = barrel.x - 25 + 'px';
                    explosion.style.top = barrel.y - 25 + 'px';
                    explosion.style.background = 'radial-gradient(circle, rgba(255,165,0,0.8), rgba(255,0,0,0.5))';
                    explosion.style.borderRadius = '50%';
                    explosion.style.animation = 'explode 0.5s forwards';
                    document.getElementById('gameArea').appendChild(explosion);
                    const playerDistance = getDistance(player.x, player.y, barrel.x + 25, barrel.y + 25);
                    const botDistance = getDistance(bot.x, bot.y, barrel.x + 25, barrel.y + 25);
                    if (playerDistance < 100) {
                        player.health -= Math.max(0, 30 * (1 - playerDistance / 100));
                        updateHealthBars();
                    }
                    if (botDistance < 100) {
                        bot.health -= Math.max(0, 30 * (1 - botDistance / 100));
                        updateHealthBars();
                    }
                    setTimeout(() => {
                        barrel.element.remove();
                        explosion.remove();
                        obstacles.barrels.splice(barrelIndex, 1);
                    }, 500);
                    checkGameOver();
                } else {
                    barrel.element.style.filter = `brightness(${0.7 + 0.1 * (3 - barrel.health)})`;
                }
                bulletBlocked = true;
                return;
            }
        });
        if (bulletBlocked) return;
        const target = bullet.isPlayer ? bot : player;
        const dx = bullet.x - target.x;
        const dy = bullet.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 20) {
            target.health -= bullet.damage;
            bullet.element.remove();
            gameState.bullets.splice(index, 1);
            updateHealthBars();
            if (bullet.isPlasma) {
                sounds.explosion.currentTime = 0;
                sounds.explosion.play().catch(error => {
                    console.log("Audio playback failed:", error);
                });
            }
            checkGameOver();
        }
        if (bullet.x < 0 || bullet.x > window.innerWidth || bullet.y < 0 || bullet.y > window.innerHeight) {
            bullet.element.remove();
            gameState.bullets.splice(index, 1);
        }
    });
    gameState.powerups.forEach((powerup, index) => {
        const dx = powerup.x - player.x;
        const dy = powerup.y - player.y;
        const playerDistance = Math.sqrt(dx * dx + dy * dy);
        const dx2 = powerup.x - bot.x;
        const dy2 = powerup.y - bot.y;
        const botDistance = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (playerDistance < 30) {
            applyPowerup(player, powerup.type);
            powerup.element.remove();
            gameState.powerups.splice(index, 1);
        } else if (botDistance < 30) {
            applyPowerup(bot, powerup.type);
            powerup.element.remove();
            gameState.powerups.splice(index, 1);
        }
    });
    if (Math.random() < 0.02) {
        spawnPowerup();
    }
    requestAnimationFrame(gameLoop);
}