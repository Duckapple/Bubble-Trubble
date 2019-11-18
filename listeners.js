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