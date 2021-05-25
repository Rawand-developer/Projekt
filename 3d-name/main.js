var text = prompt("تکایە ناوت یان ناوی هەرشتێک بنووسە بۆ ئەوەی دیزاینەکە دەربچێت:\nبۆ نموونە", "Rawand");
var down = new Vector(-100, 200);
var stripDistance = 60;
var options = {
    kerning: true,
    hinting: false,
    features: {
        liga: true,
        rlig: true
    }
};
var font = null;
window.onload = function() {
    opentype.load('https://fonts.gstatic.com/s/chakrapetch/v3/cIflMapbsEk7TDLdtEz1BwkeJI91R5_A.ttf', function(err, gotFont) {
        if (err) {
            console.log(err.toString());
            return;
        }
        font = gotFont;
        makeGulch();
    });
}
function makeGulch() {
    var gulch = new Gulch();
    gulch.drawBackground();
    gulch.drawGlyphs();
}
function Gulch() {
    var translate = 0;
    var glyphs = font.stringToGlyphs(text, options);
    this.glyphs = [];
    for (var idx in glyphs) {
        var glyph = glyphs[idx];
        this.glyphs.push(new Glyph(glyph, idx, translate));
        translate += glyph.advanceWidth;
    }
}
Gulch.prototype.drawBackground = function() {
    // determinate BoundingBox
    var boundingBox = new BoundingBox();
    this.glyphs.forEach((glyph) => { boundingBox.addBox(glyph.boundingBox); } );
    var centrum = new Vector((boundingBox.x.min + boundingBox.x.max) / 2, (boundingBox.y.min + boundingBox.y.max) / 2);
    boundingBox.addFrame(boundingBox.getMinSize() * 0.1);
    var alphaRad = Math.atan(down.x / down.y);
    var svgBox = new BoundingBox();
    svgBox.cover(new Vector(boundingBox.x.min, boundingBox.y.min).rotate(alphaRad, centrum));
    svgBox.cover(new Vector(boundingBox.x.min, boundingBox.y.max).rotate(alphaRad, centrum));
    svgBox.cover(new Vector(boundingBox.x.max, boundingBox.y.min).rotate(alphaRad, centrum));
    svgBox.cover(new Vector(boundingBox.x.max, boundingBox.y.max).rotate(alphaRad, centrum));
    svgBox.addFrame(svgBox.getMinSize() * 0.05);
    var svg = document.getElementById("svg");
    svg.setAttribute("viewBox", svgBox.getViewBoxString());
    // Paper
    var jsText = document.getElementById("jsText");
    jsText.setAttribute("transform", "rotate(" + (alphaRad*180/Math.PI) + " " + centrum.x + " " + centrum.y + ")");
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", boundingBox.x.min); rect.setAttribute("y", boundingBox.y.min);
    rect.setAttribute("width", boundingBox.x.length()); rect.setAttribute("height", boundingBox.y.length());
    rect.setAttribute("fill", "rgb(255,255,255)");
    jsText.appendChild(rect);
    // Strips
    for (var y = Math.ceil(boundingBox.y.min / stripDistance) * stripDistance; y <= boundingBox.y.max; y += stripDistance) {
        drawLine(boundingBox.x.min, y, boundingBox.x.max, y, jsText);
    }
}
Gulch.prototype.drawGlyphs = function() {
    this.glyphs.forEach((g) => { g.draw(); });
}
function Glyph(glyph, idx, translate) {
    this.glyph = glyph;
    var path = glyph.path.toSVG();
    this.pathd = path.substring('<path d="'.length, path.length-'"/>'.length);
    this.id = idx;
    this.translate = translate;
    this.boundingBox = new BoundingBox();
    this.walls = [];
    var start = new Vector(this.translate, 0);
    var last = new Vector(this.translate, 0);
    var end = new Vector(this.translate, 0);
    var coordEx = /([MLZ])((\d+(?:\.\d+)?)([, \-])(\d+(?:\.\d+)?))?/gi;
    match = coordEx.exec(this.pathd);
    while (null != match) {
        var v = undefined !== match[3] ? new Vector(this.translate + parseFloat(match[3]), (match[4]==="-"?1:-1)*parseFloat(match[5])) : start;
        this.boundingBox.cover(v.x, v.y);
        switch (match[1]) {
        case "M":
            start = v;
            last = start;
            break;
        case "L":
            end = v;
            this.newWall(last, end, idx);
            last = end;
            break;
        case "Z":
            this.newWall(last, start, idx);
            break;
        }
        match = coordEx.exec(this.pathd);
    }
}
Glyph.prototype.newWall = function(p, q, g) {
    if (p.equals(q)) { return; }
    w = new Wall(p, q, g, 0);
    for (var i = 0; i < this.walls.length; ++i) {
        if (w.equals(this.walls[i])) { return; }
    }
    w.idx = this.walls.length;
    this.walls.push(w);
    w.fillHides(this.walls);
}
Glyph.prototype.draw = function() {
    var clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clip.setAttribute("id", "clip"+this.id);
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", this.pathd);
    p.setAttribute("transform", "scale(1 -1) translate(" + this.translate + ")");
    clip.appendChild(p);
    document.getElementById("defs").appendChild(clip);
    var g = p.cloneNode();
    g.setAttribute("fill", "black");
    document.getElementById("jsText").appendChild(g);
    var ready = [];
    for (var j = 0; j < this.walls.length; ++j) {
        for (var i = 0; i < this.walls.length; ++i) {
            if (this.walls[i].hide.length != 0) { continue; }
            this.walls[i].draw();
            this.walls.forEach((w) => { w.hide = w.hide.filter(x => !x.equals(this.walls[i])); });
            this.walls[i].hide = [ this.walls[i] ];
            ready.push(i);
            break;
        }
    }
}
function Wall(p, q, gidx, idx) {
    this.p = p;
    this.q = q;
    this.gidx = gidx;
    this.idx = idx;
}
Wall.prototype.fillHides = function(walls) {
    this.pd = this.p.add(down);
    this.qd = this.q.add(down);
    this.bread = [ new Line(this.p, this.q), new Line(this.p, this.pd), new Line(this.pd, this.qd), new Line(this.qd, this.q) ];
    this.hide = [];
    for (var i = 0; i < this.idx; ++i) {
        if (this.behind(walls[i])) { this.hide.push(walls[i]); }
        if (walls[i].behind(this)) { walls[i].hide.push(this); }
    }
}
hidings = [ [ 0, 1 ], [ 1, 2], [ 3, 2] ];
Wall.prototype.behind = function(w) {
    for (var i = 0; i < hidings.length; ++i) {
        if (this.bread[hidings[i][0]].crosses(w.bread[hidings[i][1]])) {
            return true;
        }
    }
    return false;
}
Wall.prototype.equals = function(w) {
    return (this.p.equals(w.p) && this.q.equals(w.q)) || (this.p.equals(w.q) && this.q.equals(w.p));
}
Wall.prototype.draw = function() {
    // create linear gradient
    var normal = down.proj(this.p.add(this.q.mul(-1)).perp()).add(this.p);
    var lg = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    lg.setAttribute("id", "lg" + this.gidx + "_" + this.idx);
    lg.setAttribute("x1", this.p.x);
    lg.setAttribute("y1", this.p.y);
    lg.setAttribute("x2", normal.x);
    lg.setAttribute("y2", normal.y);
    lg.setAttribute("gradientUnits", "userSpaceOnUse");
    var stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", "0%"); stop.setAttribute("style", "stop-color:rgb(255,255,255);stop-opacity:1");
    lg.appendChild(stop);
    stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", "100%"); stop.setAttribute("style", "stop-color:rgb(0,0,0);stop-opacity:1");
    lg.appendChild(stop);
    document.getElementById("defs").appendChild(lg);
    // create mask
    var mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", "mask" + this.gidx + "_" + this.idx);
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", "M" + this.p.x + " " + this.p.y + "L" + this.q.x + " " + this.q.y +
        "L" + (this.q.x + down.x) + " " + (this.q.y + down.y) + "L" + (this.p.x + down.x) + " " + (this.p.y + down.y) + "Z");
    p.setAttribute("fill", "url(#lg" + this.gidx + "_" + this.idx + ")");
    mask.appendChild(p);
    document.getElementById("defs").appendChild(mask);
    var pb = p.cloneNode();
    pb.setAttribute("fill", "black");
    pb.setAttribute("clip-path", "url(#clip"+this.gidx+")");
    document.getElementById("jsText").appendChild(pb);
    var pw = p.cloneNode();
    pw.setAttribute("fill", "white");
    this.group().appendChild(pw);
    this.group().setAttribute("mask", "url(#mask" + this.gidx + "_" + this.idx + ")");
    this.drawGulchLines();
}
Wall.prototype.group = function() {
    if (undefined !== this._group) { return this._group; }
    var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("clip-path", "url(#clip"+this.gidx+")");
    document.getElementById("jsText").appendChild(group);
    return this._group = group;
}
Wall.prototype.drawGulchLines = function() {
    this.getIntersects().forEach((v, index) => {
        var d = v.add(down);
        drawVectorLine(v, d, this.group());
    });
}
Wall.prototype.getIntersects = function() {
    if (this.p.y == this.q.y) return [];
    var intersects = [];
    var a = null, b = null;
    if (this.p.y < this.q.y) { a = this.p; b = this.q; } else { a = this.q; b = this.p; }
    for (var y = Math.ceil(a.y / stripDistance) * stripDistance; y <= b.y; y += stripDistance) {
        // a + (b-a)*r, where r=(y-a.y)/(b.y-a.y)
        intersects.push(a.add(b.add(a.mul(-1)).mul((y - a.y)/(b.y - a.y))));
    }
    return intersects;
}
function Line(p, q) {
    this.p = p;
    this.q = q;
    this.equation = new Equation(p, q);
}
Line.prototype.crosses = function(l) {
    return 0 > this.equation.eval(l.p) * this.equation.eval(l.q) && 0 > l.equation.eval(this.p) * l.equation.eval(this.q);
}
function Equation(p, q) { // a*x + b*y = c
    this.a = p.y - q.y;
    this.b = q.x - p.x;
    if (new Vector(this.a, this.b).mul(down) < 0) {
        this.a *= -1;
        this.b *= -1;
    }
    this.c = this.a * p.x + this.b * p.y;
}
Equation.prototype.eval = function(p) {
    return this.a * p.x + this.b * p.y - this.c;
}
function BoundingLine() {
    this.min = NaN;
    this.max = NaN;
}
BoundingLine.prototype.cover = function(v) {
    if (isNaN(v)) return;
    if (isNaN(this.min)) { this.min = v; this.max = v; return; }
    if (v < this.min) { this.min = v; return; }
    if (v > this.max) { this.max = v; return; }
}
BoundingLine.prototype.length = function() {
    return this.max - this.min;
}
function BoundingBox() {
    this.x = new BoundingLine();
    this.y = new BoundingLine();
}
BoundingBox.prototype.cover = function(x, y) {
    if (undefined !== x.x) {
        this.cover(x.x, x.y);
        return;
    }
    this.x.cover(x);
    this.y.cover(y);
}
BoundingBox.prototype.addBox = function(b) {
    this.x.cover(b.x.min);
    this.x.cover(b.x.max);
    this.y.cover(b.y.min);
    this.y.cover(b.y.max);
}
BoundingBox.prototype.addFrame = function(delta) {
    this.x.min -= delta;
    this.x.max += delta;
    this.y.min -= delta;
    this.y.max += delta;
}
BoundingBox.prototype.getMinSize = function() {
    return Math.min(this.x.length(), this.y.length());
}
BoundingBox.prototype.getViewBoxString = function() {
    var clientWidth = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight;
    var viewWidth = this.x.length();
    var viewHeight = this.y.length();
    if (viewWidth / viewHeight > clientWidth / clientHeight) {
        viewHeight = viewWidth * clientHeight / clientWidth;
    } else {
        viewWidth = viewHeight * clientWidth / clientHeight;
    }
    var ox = (this.x.min + this.x.max) / 2;
    var oy = (this.y.min + this.y.max) / 2;
    return (ox - viewWidth / 2) + " " + (oy - viewHeight / 2) + " " + viewWidth + " " + viewHeight;
}
function Vector(x, y) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
}
Vector.prototype.add = function(v, y) {
    if (undefined === v.x) {
        return new Vector(this.x + v, this.y + y);
    }
    return new Vector(this.x + v.x, this.y + v.y);
}
Vector.prototype.mul = function(v, y) {
    if (undefined === v.x) {
        if (undefined === y) {
            return new Vector(this.x * v, this.y * v);
        }
        return this.x * v + this.y * y;
    }
    return this.x * v.x + this.y * v.y;
}
Vector.prototype.proj = function(a) {
    return a.mul(a.mul(this)/a.mul(a));
}
Vector.prototype.length = function() {
    if (undefined !== this._length) { return this._length; }
    return this._length = Math.sqrt(this.x * this.x + this.y * this.y);
}
Vector.prototype.perp = function() {
    return new Vector(this.y, -this.x);
}
Vector.prototype.equals = function(v) {
    return this.x == v.x && this.y == v.y;
}
Vector.prototype.rotate = function(alphaRad, centrum) {
    if (undefined === centrum) {
        return new Vector(this.x * Math.cos(alphaRad) - this.y * Math.sin(alphaRad), this.x * Math.sin(alphaRad) + this.y * Math.cos(alphaRad));
    }
    return this.add(centrum.mul(-1)).rotate(alphaRad).add(centrum);
}
function drawVectorLine(p, q, g) {
    drawLine(p.x, p.y, q.x, q.y, g);
}
function drawLine(x1, y1, x2, y2, g) {
    var l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1);
    l.setAttribute("y1", y1);
    l.setAttribute("x2", x2);
    l.setAttribute("y2", y2);
    l.setAttribute("style", "stroke:rgb(0,0,220);stroke-width:3");
    g.appendChild(l);
}