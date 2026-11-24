const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const FLOOR = 455;
const GRAVITY = 0.75;
const keys = {};

let gameOver = false;
let winner = "";
let timer = 99;
let lastTime = performance.now();
let timerAccumulator = 0;

const fighters = [];

class Fighter {
    constructor(x, color, name, controls) {
        this.startX = x;
        this.x = x;
        this.y = FLOOR;
        this.vy = 0;
        this.color = color;
        this.name = name;
        this.controls = controls;

        this.width = 48;
        this.height = 105;
        this.health = 100;
        this.facing = 1;

        this.attack = null;
        this.cooldown = 0;
        this.stun = 0;
        this.hitThisAttack = false;
        this.jumpCount = 0;
        this.walkFrame = 0;
    }

    get airborne() {
        return this.y < FLOOR;
    }

    jump() {
        if (this.jumpCount < 1 && !gameOver) {
            this.vy = -15;
            this.jumpCount++;
        }
    }

    startAttack(type) {
        if (this.cooldown > 0 || this.attack || this.stun > 0 || gameOver) return;

        this.attack = {
            type: type,
            time: 0,
            duration: 300
        };

        this.hitThisAttack = false;
        this.cooldown = type === "kick" ? 0.48 : 0.32;
    }

    update(dt, opponent) {
        if (this.health <= 0) return;

        this.facing = this.x < opponent.x ? 1 : -1;

        if (this.cooldown > 0) {
            this.cooldown -= dt / 1000;
        }

        if (this.stun > 0) {
            this.stun -= dt;
        }

        if (!this.stun && !this.attack && !gameOver) {
            if (keys[this.controls.left]) {
                this.x -= 0.32 * dt;
                this.walkFrame += dt * 0.015;
            }

            if (keys[this.controls.right]) {
                this.x += 0.32 * dt;
                this.walkFrame += dt * 0.015;
            }
        }

        this.x = Math.max(25, Math.min(canvas.width - 25, this.x));

        this.vy += GRAVITY * (dt / 16.67);
        this.y += this.vy * (dt / 16.67);

        if (this.y >= FLOOR) {
            this.y = FLOOR;
            this.vy = 0;
            this.jumpCount = 0;
        }

        if (this.attack) {
            this.attack.time += dt;

            const t = this.attack.time;

            if (t >= 95 && t <= 205 && !this.hitThisAttack) {
                this.checkHit(opponent);
            }

            if (t >= this.attack.duration) {
                this.attack = null;
            }
        }
    }

    checkHit(opponent) {
        const distance = Math.abs(this.x - opponent.x);
        const verticalDistance = Math.abs(
            (this.y - this.height / 2) -
            (opponent.y - opponent.height / 2)
        );

        const reach = this.attack.type === "kick" ? 112 : 88;

        if (
            distance < reach &&
            verticalDistance < 100 &&
            this.health > 0 &&
            opponent.health > 0
        ) {
            const damage = this.attack.type === "kick" ? 13 : 8;

            opponent.health = Math.max(0, opponent.health - damage);
            opponent.stun = 240;
            opponent.x += this.facing * 20;

            this.hitThisAttack = true;
        }
    }

    draw() {
        const x = this.x;
        const y = this.y;
        const f = this.facing;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(f, 1);

        // Sombra
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        const moving = !this.attack && !this.stun && this.walkFrame > 0;
        const step = moving ? Math.sin(this.walkFrame) * 5 : 0;

        // Piernas
        ctx.strokeStyle = "#171727";
        ctx.lineWidth = 15;
        ctx.lineCap = "round";

        if (this.attack && this.attack.type === "kick") {
            const active = this.attack.time > 75 && this.attack.time < 220;

            ctx.beginPath();
            ctx.moveTo(-10, -42);
            ctx.lineTo(-18, -5);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, -42);
            ctx.lineTo(active ? 78 : 24, active ? -60 : -5);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(-12, -45);
            ctx.lineTo(-14 - step, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(12, -45);
            ctx.lineTo(14 + step, 0);
            ctx.stroke();
        }

        // Cuerpo
        ctx.fillStyle = this.color;
        ctx.fillRect(-23, -95, 46, 58);

        // Cinturón
        ctx.fillStyle = "#f5d142";
        ctx.fillRect(-23, -48, 46, 7);

        // Brazos
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 13;

        if (this.attack && this.attack.type === "punch") {
            ctx.beginPath();
            ctx.moveTo(12, -83);
            ctx.lineTo(55, -75);
            ctx.stroke();

            ctx.fillStyle = "#f2c19b";
            ctx.beginPath();
            ctx.arc(57, -75, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-17, -83);
            ctx.lineTo(-28, -55);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(-17, -83);
            ctx.lineTo(-29, -55);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(17, -83);
            ctx.lineTo(29, -55);
            ctx.stroke();
        }

        // Cabeza
        ctx.fillStyle = "#f2c19b";
        ctx.beginPath();
        ctx.arc(0, -111, 22, 0, Math.PI * 2);
        ctx.fill();

        // Pelo
        ctx.fillStyle = "#25202a";
        ctx.beginPath();
        ctx.arc(0, -120, 22, Math.PI, Math.PI * 2);
        ctx.fill();

        // Ojo
        ctx.fillStyle = "#151515";
        ctx.fillRect(9, -114, 5, 5);

        // Efecto de golpe
        if (this.attack && this.attack.time > 75 && this.attack.time < 220) {
            ctx.fillStyle = "rgba(255,235,70,0.7)";
            ctx.beginPath();
            ctx.arc(
                this.attack.type === "kick" ? 76 : 58,
                this.attack.type === "kick" ? -60 : -75,
                17,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();

        // Nombre
        ctx.fillStyle = "white";
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.name, x, y - 145);
    }
}

fighters.push(
    new Fighter(240, "#df3030", "PLAYER 1", {
        left: "a",
        right: "d",
        jump: "w",
        punch: "f",
        kick: "g"
    })
);

fighters.push(
    new Fighter(720, "#2869e8", "PLAYER 2", {
        left: "arrowleft",
        right: "arrowright",
        jump: "arrowup",
        punch: "k",
        kick: "l"
    })
);

// Controles
window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if ([
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " "
    ].includes(key)) {
        e.preventDefault();
    }

    if (!keys[key]) {
        fighters.forEach(f => {
            if (key === f.controls.jump) f.jump();
            if (key === f.controls.punch) f.startAttack("punch");
            if (key === f.controls.kick) f.startAttack("kick");
        });
    }

    keys[key] = true;

    if (key === "r") restartGame();
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

function drawBackground() {
    // Cielo
    const gradient = ctx.createLinearGradient(0, 0, 0, FLOOR);
    gradient.addColorStop(0, "#171b45");
    gradient.addColorStop(1, "#c05a65");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, FLOOR);

    // Luna
    ctx.fillStyle = "#ffe6a1";
    ctx.beginPath();
    ctx.arc(790, 100, 43, 0, Math.PI * 2);
    ctx.fill();

    // Edificios
    for (let i = 0; i < 12; i++) {
        const x = i * 90;
        const h = 90 + (i % 4) * 30;

        ctx.fillStyle = "#252344";
        ctx.fillRect(x, FLOOR - h, 75, h);

        ctx.fillStyle = "#ffcf6b";

        for (let j = 0; j < 3; j++) {
            ctx.fillRect(x + 12 + j * 19, FLOOR - h + 18, 8, 10);
        }
    }

    // Suelo
    ctx.fillStyle = "#292936";
    ctx.fillRect(0, FLOOR, canvas.width, 85);

    ctx.fillStyle = "#50505c";
    ctx.fillRect(0, FLOOR, canvas.width, 7);

    for (let i = 0; i < canvas.width; i += 65) {
        ctx.fillStyle = "#3c3c4b";
        ctx.fillRect(i, FLOOR + 35, 35, 3);
    }
}

function drawHealthBars() {
    const p1 = fighters[0];
    const p2 = fighters[1];

    ctx.fillStyle = "#111";
    ctx.fillRect(35, 25, 390, 28);
    ctx.fillRect(535, 25, 390, 28);

    ctx.fillStyle = "#ed3333";
    ctx.fillRect(35, 25, 390 * p1.health / 100, 28);

    ctx.fillStyle = "#2684ff";
    const width = 390 * p2.health / 100;
    ctx.fillRect(925 - width, 25, width, 28);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 25, 390, 28);
    ctx.strokeRect(535, 25, 390, 28);

    ctx.fillStyle = "white";
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "left";
    ctx.fillText("PLAYER 1", 35, 17);

    ctx.textAlign = "right";
    ctx.fillText("PLAYER 2", 925, 17);

    ctx.textAlign = "center";
    ctx.font = "bold 35px Arial";
    ctx.fillStyle = "#ffdd44";
    ctx.fillText(timer, 480, 43);
}

function drawGameOver() {
    if (!gameOver) return;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffdd44";
    ctx.font = "bold 55px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        winner === "EMPATE" ? "¡EMPATE!" : "¡" + winner + " GANA!",
        480, 235
    );

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Pulsa R para volver a jugar", 480, 290);
}

function restartGame() {
    fighters[0].health = 100;
    fighters[1].health = 100;

    fighters.forEach(f => {
        f.x = f.startX;
        f.y = FLOOR;
        f.vy = 0;
        f.attack = null;
        f.cooldown = 0;
        f.stun = 0;
        f.hitThisAttack = false;
        f.jumpCount = 0;
        f.walkFrame = 0;
    });

    timer = 99;
    timerAccumulator = 0;
    gameOver = false;
    winner = "";
    lastTime = performance.now();
}

function update(dt) {
    if (gameOver) return;

    fighters[0].update(dt, fighters[1]);
    fighters[1].update(dt, fighters[0]);

    // Evitar que los personajes se atraviesen
    const distance = Math.abs(fighters[0].x - fighters[1].x);

    if (
        distance < 43 &&
        !fighters[0].airborne &&
        !fighters[1].airborne
    ) {
        const overlap = (43 - distance) / 2;
        const direction = fighters[0].x < fighters[1].x ? -1 : 1;

        fighters[0].x += direction * overlap;
        fighters[1].x -= direction * overlap;
    }

    timerAccumulator += dt;

    if (timerAccumulator >= 1000) {
        timer--;
        timerAccumulator -= 1000;
    }

    if (fighters[0].health <= 0) {
        gameOver = true;
        winner = "PLAYER 2";
    } else if (fighters[1].health <= 0) {
        gameOver = true;
        winner = "PLAYER 1";
    } else if (timer <= 0) {
        gameOver = true;

        if (fighters[0].health > fighters[1].health) {
            winner = "PLAYER 1";
        } else if (fighters[1].health > fighters[0].health) {
            winner = "PLAYER 2";
        } else {
            winner = "EMPATE";
        }
    }
}

function draw() {
    drawBackground();

    // Mensaje central
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "bold 25px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FIGHT!", 480, 160);

    fighters.forEach(f => f.draw());

    drawHealthBars();
    drawGameOver();
}

function gameLoop(now) {
    const dt = Math.min(now - lastTime, 40);
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);