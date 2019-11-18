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


function logic() {
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

function paint() {
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
}

function debugSpeed() {
    if (currentKeys["pageup"] && gameSpeed < 1) {
        gameSpeed += 0.01;
    } else if (currentKeys["pagedown"] && gameSpeed > 0.1) {
        gameSpeed -= 0.01;
    }
}

function hotJoin() {
    if (time > joinTimer + 30) {
        if (currentKeys["/"] && players.length > 1) {
            players.pop();
            joinTimer = time;
        } else if (currentKeys["*"] && players.length < 4) {
            players.push(new Player({x:c.w/2, y: c.h - 25}, players.length));
            joinTimer = time;
        }
    }
}



function step() {
    if (!paused()) {
        logic();
    }

    paint();

    debugSpeed();

    hotJoin();

    time++;
    window.requestAnimationFrame(step);
}
