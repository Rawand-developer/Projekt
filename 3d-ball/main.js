onload = () => {
"use strict";

let ctx, fps,
    timeStarted, timeEnded,
    particles = [],
    azimuthR = false,
    W = innerWidth,
    H = innerHeight,
    camera = {x:0, y:0, z:-5, speed:10},
    mouse = {x:0, y:0, force:5, isActive:false},
    touch = {x:0, y:0, force:10};

const project = (r, t, p, c) => ({
    x: r * Math.sin(p) * Math.cos(t) - c.x,
    y: r * Math.cos(p) - c.y,
    z: r * Math.sin(p) * Math.sin(t) + r - c.z,
});

// azimuth coord
const theta = () => Math.random() * 2 * Math.PI;
// zenith coord
const phi = () => Math.acos(Math.random() * Math.PI - 1);

const eventHandler = () => {
    const swipe = (x1, y1, x2, y2, speed) => {
        let diffX = x2 - x1;
        let diffY = y2 - y1;
        if(Math.abs(diffX) > Math.abs(diffY)) {
            if(diffX > 0) camera.x -= speed;
            else camera.x += speed;
        } else  {
            if(diffY > 0) camera.y -= speed;
            else camera.y += speed;
        }
    }

    ctx.canvas.addEventListener("mousedown", e => {
        mouse.isActive = true;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    ctx.canvas.addEventListener("mousemove", e => {
        if(mouse.isActive) 
            swipe(mouse.x, mouse.y, e.clientX, e.clientY, mouse.force);
    });

    ctx.canvas.addEventListener("mouseup", () => {
        mouse.isActive = false;
    });

    ctx.canvas.addEventListener("touchstart", e => {
        touch.x = e.touches[0].pageX;
        touch.y = e.touches[0].pageY;
    });

    ctx.canvas.addEventListener("touchmove", e => {
        swipe(touch.x, touch.y, e.touches[0].pageX, e.touches[0].pageY, touch.force);
    });
}

class Particle {
    constructor(thetaa, phia) {
        this.theta = theta();
        this.phi = phi();
        this.radius = 300;
        this.size = 4;

        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.projectedX = 0;
        this.projectedY = 0;
        this.projectedZ = 0;
        this.scale = 0;
    }

    project() {
        this.x = project(this.radius, this.theta, this.phi, camera).x;
        this.y = project(this.radius, this.theta, this.phi, camera).y;
        this.z = project(this.radius, this.theta, this.phi, camera).z;

        this.scale = W * .2 / (W * .2 + this.z)
        this.projectedX = this.x * this.scale + W * .5;
        this.projectedY = this.y * this.scale + H * .5;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        //ctx.globalAlpha = 1 - this.z / W;
        ctx.fillStyle = "lightgray";
        ctx.arc(this.projectedX, this.projectedY, 
            Math.abs(this.size * 2 * this.scale), 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    update() {
        this.theta += .04;
        if(azimuthR)this.phi += .04;
        this.project();
        this.draw();
    }
}

for(let i=0; i < 800; i++) particles.push(new Particle());

const update = () => {
    particles.sort((a, b) => a.scale - b.scale);
    particles.forEach(particle => particle.update());

    ctx.fillStyle = "red";
    ctx.font = "bold 20px Courier New";
    ctx.fillText(fps, W - 100, 50);
}

const animate = () => {
    ctx.clearRect(0, 0, W, H);
    update();
    requestAnimationFrame(animate);
    timeEnded = performance.now();
    fps = "FPS: "+ Number(~~(1000 / (timeEnded - timeStarted)));
    timeStarted = timeEnded;
}

(() => {
    ctx = document.querySelector("#cvs").getContext("2d");
    ctx.canvas.width = W;
    ctx.canvas.height = H;
    ctx.canvas.style.backgroundColor = "";
    let range = document.querySelector("#azi");

    range.onchange = () => {
        if(range.value > 0) azimuthR = true;
        else {
            azimuthR = false
            particles.forEach(particle => particle.phi = phi());
        };
    }

    requestAnimationFrame(animate);
    eventHandler();
})();

}
//window.addEventListener("load", init);