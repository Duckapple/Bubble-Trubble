const c = {w: 1280, h: 720}
const weight = 0.2;
const sizes = [
    { bs: 9,  r: 10, },
    { bs: 11, r: 20, },
    { bs: 13, r: 30, },
    { bs: 14, r: 40, },
    { bs: 15, r: 50, },
    { bs: 12, r: 70, weightMod: 0.7 },
    { bs: 9, r: 80, weightMod: 0.4 },
];
let levels = [];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let time = 0;
let gameSpeed = 1;
let level = 0;
let debug = false;
let levelCountdown = 0;
let joinTimer = 0;

let currentKeys = {};

let harpoons = [];

let pause = false;
let pauseHeld = false;

let controls = {
    players: [
        {
            "w": "up",
            "s": "down",
            "a": "left",
            "d": "right",
            " ": "shoot",
            "spacebar": "shoot",
        },
        {
            "arrowup": "up",
            "arrowdown": "down",
            "arrowleft": "left",
            "arrowright": "right",
            "shift": "shoot",
        },
        {
            "i": "up",
            "k": "down",
            "j": "left",
            "l": "right",
            "-": "shoot",
            "_": "shoot",
        },
        {
            "8": "up",
            "5": "down",
            "4": "left",
            "6": "right",
            "+": "shoot",
        },
    ],
    debug: {
        "å": "",
    },
};

let playerColors = [
    "green",
    "blue",
    "orange",
    "red",
]

class Shape {
    constructor(position, color) {
        this.x = position.x;
        this.y = position.y;
        this.color = color || "#666";
    }
    // draw(ctx) {}
    // bounds() {}
    // update(speed) {}
}

class Harpoon extends Shape {
    constructor(position, owner, color, modifiers) {
        super(position, color);
        this.h = 0;
        this.hits = 0;
        this.owner = owner;
        this.popping = true;
        this.modifiers = modifiers || {};
        this.modifiers.speed = this.modifiers.speed || 12;
        this.modifiers.maxHits = this.modifiers.maxHits || 1;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x-1, this.y - this.h, 3, this.h);

        ctx.beginPath();
        ctx.moveTo(this.x-2, this.y - this.h);
        ctx.lineTo(this.x + 0.5, this.y - this.h - 15);
        ctx.lineTo(this.x+3, this.y - this.h);
        ctx.fill();
    }

    bounds() {
        return {
            x1: this.x-1,
            x2: this.x+2,
            y1: this.y - this.h - 15,
            y2: this.y,
        };
    }

    update(speed) {
        this.h += this.modifiers["speed"] * speed;
        return this.y - this.h >= 15;
    }
}

class Enemy extends Shape {
    constructor(size, position, color) {
        super(position, color);
        this.size = size;
    }
    intersects(shape) {}
}

class Circle extends Enemy {
    constructor(size, position, initialSpeed, color) {
        super(size, position, color);
        const thisSize = sizes[size];
        this.dx = initialSpeed;
        this.dy = -5;
        this.r = thisSize.r;
        this.bs = thisSize.bs;
        this.weightMod = thisSize.weightMod || 1;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    bounds() {
        return {
            x1: this.x - this.r, 
            y1: this.y - this.r, 
            x2: this.x + this.r, 
            y2: this.y + this.r,
        }
    }

    update(speed) {
        this.x += this.dx * speed;
        this.gravity(speed);
        if (this.x > c.w-this.r || this.x < this.r) {
            this.dx = -this.dx;
            this.x += this.dx * speed;
        }
    }

    intersects(bound) {
        const b2 = this.bounds();
        return !(b2.x2 < bound.x1 ||
                b2.x1 > bound.x2 ||
                b2.y2 < bound.y1 ||
                b2.y1 > bound.y2);
    }

    gravity(speed) {
        this.dy += weight * this.weightMod * speed;
        this.y += this.dy * speed;
        if (this.y > c.h-this.r) {
            this.dy = -this.bs;
            this.y += this.dy * speed;
        }
    }
}

class Player extends Shape {
    constructor(position, playerNumber) {
        super(position, playerColors[playerNumber]);
        this.number = playerNumber;
        this.cooldown = 0;
        this.shooting = false;
        this.modifiers = {
            speed: 1,
            maxShots: 1,
        };
        this.shots = this.modifiers.maxShots;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 15, this.y - 25, 30, 50);
        ctx.strokeRect(this.x - 15, this.y - 25, 30, 50);
    }

    bounds() {
        return {
            x1: this.x - 15,
            x2: this.x + 15,
            y1: this.y - 25,
            y2: this.y + 25,
        }
    }

    update(speed) {
        const {speed: speedMod, maxShots} = this.modifiers;
        const input = {};
        for (const key in currentKeys) {
            if (!currentKeys.hasOwnProperty(key) || !currentKeys[key]) {
                continue;
            }
            const control = controls.players[this.number][key];
            if (control) {
                input[control] = true;
            }
        }
        if (input["left"] && !input["right"]) {
            this.x -= 5 * speed * speedMod;
            if (this.x < 15) {
                this.x = 15;
            }
        } else if (input["right"] && !input["left"]) {
            this.x += 5 * speed * speedMod;
            if (this.x > 1265) {
                this.x = 1265;
            }
        }
        this.cooldown -= 1 * speed;
        if (this.cooldown <= 0 && input["shoot"] && this.shots != 0) {
            this.shots--;
            harpoons.push(new Harpoon({x: this.x, y: this.y + 25}, this));
        }
    }

    freeShot() {
        this.cooldown = this.modifiers.cooldown || 15;
        this.shots++;
    }
}

let currentLevel = [];

let players = [
    new Player( {x: c.w / 2, y: c.h - 25}, 0 ),
]

function checkHit(type, targetType, maxHits) {
    let hits = 0;
    for (const t1 of type) {
        const b1 = (t1.bounds || (()=>t1)).bind(t1)();
        for (let i = 0; i < targetType.length; i++) {
            const t2 = targetType[i];
            if (!t2.intersects(b1)) {
                continue;
            }
            if (t1.popping) {
                split(i, targetType); 
            }
            hits++;
            if (maxHits && hits == maxHits) {
                return hits;
            }
        }
    }
    return hits;
}

function split(index, array) {
    const obj = array[index];
    array.splice(index, 1);
    const size = obj.size-1;
    if (size >= 0) {
        const pos = { x: obj.x, y: obj.y }
        array.push( new obj.constructor(size, pos, obj.dx, obj.color), new obj.constructor(size, pos, -obj.dx, obj.color));
    }
}

function paused() {
    if (currentKeys["escape"] || currentKeys["p"]) {
        if (!pauseHeld) {
            pause = !pause;
        }
        pauseHeld = true;
    } else {
        pauseHeld = false;
    }
    return pause;
}

function printKeys(ctx) {
    if (!!currentKeys) {
        message = "";
        for (const key in currentKeys) {
            if (currentKeys.hasOwnProperty(key) && currentKeys[key]) {
                message += key;
            }
        }
        ctx.font = "48px sans-serif";
        ctx.fillStyle = "#bbb";
        ctx.fillText(message, 10, 50);
    }
}

function positionPlayers() {
    number = players.length;
    for (let i = 0; i < number;) {
        const player = players[i];
        player.y = c.h - 25;
        i++;
        player.x = c.w * i / (number + 1);
    }
}

// currentLevel = []

// count = 0;

// for (let i = 30; i < 1280; i+=20) {
//     for (let j = 100; j < 600; j+=25) {
//         count++;
//         const color = `rgb(
//             ${Math.floor(255 - 0.1 * i)},
//             ${Math.floor(255 - 0.1 * j)},
//             0)`;
//         currentLevel.push(gen(0, { x: i, y: j }, 3, color));
//     }
// }

// console.log(count);


function step() {
    if (!paused()) {
        if (currentLevel.length == 0) {
            if (levelCountdown > 0) {
                levelCountdown--;
            } else if (levelCountdown === 0) {
                levelCountdown = -1;
                positionPlayers();
                currentLevel = levels[level];
            } else if (levels.length > ++level) {
                levelCountdown = 90;
            }
        }

        for (let enemy of currentLevel) {
            enemy.update(gameSpeed);
        }

        for (let player of players) {
            player.update(gameSpeed);
            if (checkHit([player], currentLevel, 1)) {
                pause = true;
            }
        }

        for (const harpoonKey in harpoons) {
            const harpoon = harpoons[harpoonKey];
            const hitStatic = harpoon.update(gameSpeed);
            harpoon.hits += checkHit([harpoon], currentLevel, harpoon.modifiers.maxHits);
            if (harpoon.hits >= harpoon.modifiers.maxHits || !hitStatic) {
                harpoons.splice(harpoonKey, 1);
                harpoon.owner.freeShot();
                continue;
            }
        }
    }

    ctx.fillStyle = "#444";
    ctx.strokeStyle = "#888";
    ctx.fillRect(0,0,c.w,c.h);
    
    for (const harpoon of harpoons) {
        harpoon.draw(ctx);
    }

    for (let enemy of currentLevel) {
        enemy.draw(ctx);
    }

    for (let player of players) {
        player.draw(ctx);
    }

    if (debug) {
        printKeys(ctx);
    }

    (()=>{
        if (currentKeys["pageup"] && gameSpeed < 1) {
            gameSpeed += 0.01;
        } else if (currentKeys["pagedown"] && gameSpeed > 0.1) {
            gameSpeed -= 0.01;
        }
    })();

    (()=>{
        if (time > joinTimer + 30) {
            if (currentKeys["/"] && players.length > 1) {
                players.pop();
                joinTimer = time;
            } else if (currentKeys["*"] && players.length < 4) {
                players.push(new Player({x:c.w/2, y: c.h - 25}, players.length));
                joinTimer = time;
            }
        }
    })();

    time++;
    window.requestAnimationFrame(step);
}

// Non-game Logic down here (mostly)

document.addEventListener("keydown", (e) => {
    e.preventDefault();
    currentKeys[e.key.toLowerCase()] = true;
    return false;
});

document.addEventListener("keyup", (e) => {
    e.preventDefault();
    currentKeys[e.key.toLowerCase()] = false;
    return false;
});

window.addEventListener("resize", resize);

function resize() {
    const pixelRatio = window.devicePixelRatio || 1;
    
    const win = window;
    const doc = document;
    const docElem = doc.documentElement;
    const body = doc.getElementsByTagName('body')[0];
    const x = (win.innerWidth || docElem.clientWidth || body.clientWidth) * pixelRatio;
    const y = (win.innerHeight|| docElem.clientHeight|| body.clientHeight) * pixelRatio;
    let rescale = 1.25;

    if (c.w * rescale > x || c.h * rescale > y) {                            // Downscale
        rescale = 1 / rescale;
        while (c.w * rescale > x || c.h * rescale > y) {
            rescale *= rescale;
        }
    } 

    canvas.width = rescale * c.w * pixelRatio;
    canvas.height = rescale * c.h * pixelRatio;

    canvas.style.width = `${rescale * c.w}px`;
    canvas.style.height = `${rescale * c.h}px`;

    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    ctx.scale(rescale * pixelRatio, rescale * pixelRatio);
}

resize();

window.addEventListener("load", () => window.requestAnimationFrame(step));