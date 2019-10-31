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

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.font = "48px sans-serif";

let time = 0;
let gameSpeed = 1;
let debug = false;

let currentKeys = {};

let harpoons = [];

let pause = false;
let pauseHeld = false;

let controls = [
    {
        "w": "up",
        "s": "down",
        "a": "left",
        "d": "right",
        " ": "shoot",
        "Spacebar": "shoot",
        "ArrowLeft": "left",
        "ArrowRight": "right",
    },
];

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
            x1: this.x-2,
            x2: this.x+3,
            y1: this.y - this.h - 15,
            y2: this.y - this.h,
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
        super(position);
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
            const control = controls[this.number][key];
            if (control) {
                input[control] = true;
            }
        }
        if (input["left"] && !input["right"]) {
            this.x -= 5 * speed * speedMod;
        } else if (input["right"] && !input["left"]) {
            this.x += 5 * speed * speedMod;
        }
        this.cooldown -= 1 * speed;
        if (this.cooldown <= 0 && input["shoot"] && this.shots != 0) {
            this.shots--;
            harpoons.push(new Harpoon({x: this.x, y: this.y - 25}, this));
        }
    }

    freeShot() {
        this.cooldown = this.modifiers.cooldown || 15;
        this.shots++;
    }
}

let level1 = [
    new Circle( 0, { x:100, y:500 }, 3 ),
    new Circle( 1, { x:200, y:500 }, 3 ),
    new Circle( 2, { x:300, y:500 }, 3 ),
    new Circle( 1, { x:400, y:500 }, 3 ),
    new Circle( 0, { x:500, y:500 }, 3 ),
    new Circle( 0, { x:500, y:500 }, 3 ),
    new Circle( 3, { x:500, y:310 }, 3 ),
    new Circle( 4, { x:400, y:300 }, 3 ),
    new Circle( 5, { x:300, y:330 }, 3 ),
    new Circle( 6, { x:200, y:350 }, 3 ),
]

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
            split(i, targetType);
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
    if (currentKeys["Escape"] || currentKeys["p"]) {
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
        ctx.fillText(message, 10, 50);
    }
}

// level1 = []

// count = 0;

// for (let i = 30; i < 1280; i+=20) {
//     for (let j = 100; j < 600; j+=25) {
//         count++;
//         const color = `rgb(
//             ${Math.floor(255 - 0.1 * i)},
//             ${Math.floor(255 - 0.1 * j)},
//             0)`;
//         level1.push(gen(0, { x: i, y: j }, 3, color));
//     }
// }

// console.log(count);


function step() {
    if (!paused()) {
        ctx.fillStyle = "#444";
        ctx.strokeStyle = "#888";
        ctx.fillRect(0,0,c.w,c.h);

        for (let circle of level1) {
            circle.update(gameSpeed);
            circle.draw(ctx);
        }

        for (let player of players) {
            player.update(gameSpeed);
            player.draw(ctx);
            if (checkHit([player], level1, 1)) {
                pause = true;
            }
        }

        for (const harpoonKey in harpoons) {
            const harpoon = harpoons[harpoonKey];
            const hitStatic = harpoon.update(gameSpeed);
            harpoon.hits += checkHit([harpoon], level1, harpoon.modifiers.maxHits);
            if (harpoon.hits >= harpoon.modifiers.maxHits || !hitStatic) {
                harpoons.splice(harpoonKey, 1);
                harpoon.owner.freeShot();
                continue;
            }
            harpoon.draw(ctx);
        }

        if (debug) {
            printKeys(ctx);
        }
    }

    (()=>{
        if (currentKeys["ArrowUp"] && gameSpeed < 1) {
            gameSpeed += 0.01;
        } else if (currentKeys["ArrowDown"] && gameSpeed > 0.1) {
            gameSpeed -= 0.01;
        }
    })();

    time++;
    window.requestAnimationFrame(step);
}

document.addEventListener("keydown", (e) => {
    currentKeys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
    currentKeys[e.key] = false;
});

window.requestAnimationFrame(step);