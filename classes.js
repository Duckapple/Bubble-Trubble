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