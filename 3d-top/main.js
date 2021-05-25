    var initTime = Date.now();
    var pi = Math.PI;
    var tau = 2*pi;
    var loopCount = 0;
    var fpsInterval = 16;
    var fps = 0;
    var tmpfps = 0;
    var oldRes = 0;
    var obj = [];

setInterval(update,1000/60); //updates screen max 60 times per second

function update(){
    var thisLoop = Date.now(); //gets current milliseconds
    fps += 1000 / (thisLoop - initTime); //calculates fps
    initTime = thisLoop; //resets milliseconds
    context.clearRect(0, 0, canvas.width, canvas.height); //clears the canvas before drawing on it
    mesh(thisLoop); // draws the 3D graphics
    if(loopCount%fpsInterval===0){tmpfps = fps; fps = 0;}//update fps
    context.fillStyle = "#FFFFFF";
    context.fillText("FPS: "+Math.floor(tmpfps/fpsInterval),0,w/20);// draws fps
    loopCount += 1;
}
    
//creates the vertices and faces of the 3D object
function Torus(slices,stacks){
    var verts = []; //creates empty errays
    var faces = [];
    
    var radius = 0.5;//some variables
    var scale = 0.8;
    var organic = true;
    var numBubbles = 5;
    
    for (i=0;i<slices;i++){
        for (j=0;j<stacks;j++){
        
            //greates the organic effect
            if (organic) radius = 0.5+Math.sin(i/stacks*(pi*numBubbles))/20;
            
            //generates the vertices of the torus
            var vert = [0,0,0];
            var r = 1 - radius*Math.sin((tau/stacks)*j)*scale;
            vert[0] = r*Math.sin((tau/slices)*i);
            vert[1] = radius*Math.cos((tau/stacks)*j)*scale;
            vert[2] = r*Math.cos((tau/slices)*i);
            verts[j+i*stacks] = vert;
            
            //generates the faces of the torus
            var face = [];
            face[0] = (j+stacks*(i+1))%(stacks*slices);             
            face[1] = ((j+1)%stacks+stacks*(i+1))%(stacks*slices);
            face[2] = (((j+1)%stacks)+stacks*i)%(stacks*slices);
            face[3] = j+i*stacks;
            faces[j+i*stacks] = face;
        }
    }
    return [verts,faces];
}

// transforms and draws the mesh
function mesh(i){
    var camPos = [0,3,0]; //position of the camera
    
    var res = Math.floor(slider.value);
    
    //dont update the object if the polygons havent changed
    if (oldRes!=res){
        oldRes = res;
        obj = Torus(res*2,res);
    }
    
    var verts = transform(obj[0], [i/3000,i/2000,i/1000],[1,1,1],[0,0,0],0,(res*2)*res);
    drawFaces(verts,obj[1],camPos);//draws the faces between the vertices
}

//returns the cross product of the two vectors 
//https://en.m.wikipedia.org/wiki/Cross_product
function cross(a,b){
    var result = [];
    result[0] = a[1]*b[2] - a[2]*b[1];
    result[1] = a[2]*b[0] - a[0]*b[2];
    result[2] = a[0]*b[1] - a[1]*b[0];
    return result;
}

//Returns an array of all the normal vectors of the faces. The normal vectors define the orientation of the faces. this is used by the shaders.
function GetTriangleNormalB(verts,faces){
    var normals = [];
    for(var j=0;j<faces.length;j++){
        var edge1 = [];
        var edge2 = [];
        for(var i=0;i<3;i++){
            edge1[i] = (verts[ faces[j][1] ][i] - verts[ faces[j][0] ][i]);
            edge2[i] = (verts[ faces[j][2] ][i] - verts[ faces[j][0] ][i]);
        }
        normals[j] = normalize(cross(edge1,edge2));
    }
    return normals;
}

//returns the normalised vector
function normalize(vec) {
    var x = vec[0];
    var y = vec[1];
    var z = vec[2];
    var len = Math.sqrt(x*x+y*y+z*z);
    return [x/len,y/len,z/len];
} 

//r,g,b to javascript color
function RGB2Color(c){
    return 'rgb(' + Math.round(c[0]*255) + ',' + Math.round(c[1]*255) + ',' + Math.round(c[2]*255) + ')';
}

//returns the dot product of the two vectors
// https://en.m.wikipedia.org/wiki/Dot_product?wprov=sfla1
function dot(a,b){
    return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}

//clamps a variable between two values
function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

//returns the product of the two vectors
function mul(vec1,vec2){
    return [vec1[0]*vec2[0],vec1[1]*vec2[1],vec1[2]*vec2[2]];
}

//adds two vectors together
function add(vec1,vec2){
    return [vec1[0]+vec2[0],vec1[1]+vec2[1],vec1[2]+vec2[2]];
}

//multiplies a vector by a value
function mult(val,vec2){
    return [val*vec2[0],val*vec2[1],val*vec2[2]];
}

//returns the negative vector
function neg(vec){
    return [-vec[0],-vec[1],-vec[2]];
} 

//computes the square of the distance between the two vectors
function pyth(vec1,vec2){
    var x = vec1[0]-vec2[0];
    var y = vec1[1]-vec2[1];
    var z = vec1[2]-vec2[2];
    return x*x+y*y+z*z;
}

//computes the distance between the two vectors
function distance(vec1,vec2){
    var x = vec1[0]-vec2[0];
    var y = vec1[1]-vec2[1];
    var z = vec1[2]-vec2[2];
    return Math.sqrt(x*x+y*y+z*z);
}

//gets the reflected vector
//https://www.opengl.org/discussion_boards/showthread.php/155886-Reflection-vector
function reflect(d,n){
    return [
        2*dot(d,n)*n[0]-d[0], 
        2*dot(d,n)*n[1]-d[1], 
        2*dot(d,n)*n[2]-d[2]];
}

 //http://www.opengl-tutorial.org/beginners-tutorials/tutorial-8-basic-shading/
function shader(verts,faces,normals,cam,j,lights,colors){
    
    var LightPower = .5;//power of the light source(s)
    var shininess = 30;//shininess of the object
    var specuColor = [1,1,1];//color of the gloss
    var diffuColor = [1,1,1]; //sets the  color of the faces
    var ambColor = mult(0.01,diffuColor); //ambiant color
        
        
    var E = normalize(cam);
    var n = normals[j];//gets the normal of the current iterated face
    
    var color = [0,0,0];
    
    for(var m=0;m<lights.length;m++){
        
        var l = normalize(lights[m]);//light direction
        var R = reflect(neg(l),n);//gets the reflected vector of the faces
        var dist = pyth(lights[m],faceCenter(verts,faces,j));//computes the square distance between each face and the light source
            
        var cosTheta = Math.sin(clamp(dot(n,l),0,1));
        var cosAlpha = clamp(dot(E,R),0,1);
            
        //assembles the shaders
        for(var i=0;i<3;i++){
            color[i] += ambColor[i]             
                + diffuColor[i]*colors[m][i]*LightPower*cosTheta/(dist)
                + specuColor[i]*colors[m][i]*LightPower*Math.pow(cosAlpha,shininess)/(dist);
        }
    }
    return color;
}
    
//the most important function here, it displays the faces between the vertices
function drawFaces(verts,faces,cam){
    
    var Zbuf = Zbuffer(verts,faces,cam);//updates the Z-buffer
    var normals = GetTriangleNormalB(verts,faces);//updates the normals
    
    var lights = [];//empty errays
    var colors = [];
        
    var r = 2;//rotation radius of the  point lights
        
    //create point lights that are rotating around the torus
    //you can add your own lights by adding lights[n] = [x,y,z]; and colors[n] = [r,g,b];
    lights[0] = [0, r*Math.sin(tau/10000*Date.now()), r*Math.cos(tau/10000*Date.now())];
    lights[1] = [r*Math.sin(tau/15000*Date.now()), 0, r*Math.cos(tau/15000*Date.now())];
    lights[2] = [r*Math.sin(tau/13000*Date.now()), r*Math.cos(tau/13000*Date.now()), 0];
        
    //colors of the point lights
    colors[0] = [1, 1, 0.5];
    colors[1] = [1, 0.5, 1];
    colors[2] = [0.5, 1, 1];
    
    for (p=0;p<faces.length;p++){
        
        var j = Zbuf[p]; //z-buffer
        
        var color = shader(verts,faces,normals,cam,j,lights,colors); //computes the color of the iterated face
        var px = [];
        var py = [];
        if(dot(normals[j],cam)<0.5){//don't draw if its normal vector is facing away from the camera
            for(k=0;k<faces[j].length;k++){
            
                var x = verts[faces[j][k]][0]+cam[0]; //gets the position of the vertex
                var y = verts[faces[j][k]][1]+cam[1];
                var z = verts[faces[j][k]][2]+cam[2];
                
                //sets a depth to the 3d world
                var f = m/y;
                x*=f;
                z*=f;
                
                var order = [0,1,2,3];
                px[order[k]] = w/2+x;
                py[order[k]] = h/2+z;
            }
        }
        //draws the faces
        context.fillStyle = RGB2Color(color);//set color
        fillpoly(px,py); //draws the polygon
    }
}


function fillpoly(px,py){
    context.beginPath();
    for (i=0;i<px.length;i++){
        if(i){
            context.lineTo(Math.floor(px[i]),Math.floor(py[i]));
        }else{
            context.moveTo(Math.floor(px[i]),Math.floor(py[i]));
        }
    }
    context.closePath();
    context.fill();
}

//transformation
//https://stackoverflow.com/questions/34050929/3d-point-rotation-algorithm
function transform(points, rotate, scale, translate, start, end) {
    var cosa = Math.cos(rotate[2]);
    var sina = Math.sin(rotate[2]);
        
    var cosb = Math.cos(rotate[1]);
    var sinb = Math.sin(rotate[1]);
        
    var cosc = Math.cos(rotate[0]);
    var sinc = Math.sin(rotate[0]);
    
    var Axx = cosa*cosb;
    var Axy = cosa*sinb*sinc - sina*cosc;
    var Axz = cosa*sinb*cosc + sina*sinc;
    
    var Ayx = sina*cosb;
    var Ayy = sina*sinb*sinc + cosa*cosc;
    var Ayz = sina*sinb*cosc - cosa*sinc;
    
    var Azx = -sinb;
    var Azy = cosb*sinc;
    var Azz = cosb*cosc;
    
    var out = [];
    
    for (var i = 0; i < points.length; i++) {
        if(i>=start&&i<end){
            var px = points[i][0];
            var py = points[i][1];
            var pz = points[i][2];
            
            var p = [];
            p[0] = (Axx*px + Axy*py + Axz*pz)*scale[0]+translate[0];
            p[1] = (Ayx*px + Ayy*py + Ayz*pz)*scale[1]+translate[1];
            p[2] = (Azx*px + Azy*py + Azz*pz)*scale[2]+translate[2];
            out[i] = p;
        }
        else out[i] = points[i];
    }
    return out;
}

//all the rest is z-buffer

//returns the positions of the faces 
function  faceCenter(verts,faces,k){
    var cx = 0;
    var cy = 0;
    var cz = 0;
    for(var i=0;i<faces[k].length;i++){
        var vert = faces[k][i];
        cx += verts[vert][0];
        cy += verts[vert][1];
        cz += verts[vert][2];
    }
    cx /= faces[k].length;
    cy /= faces[k].length;
    cz /= faces[k].length;
    return [cx,cy,cz];
}

//sorts an array by indices
//https://stackoverflow.com/questions/3730510/javascript-sort-array-and-return-an-array-of-indicies-that-indicates-the-positi
function sortWithIndeces(toSort) {
    for (var i = 0; i < toSort.length; i++) {
        toSort[i] = [toSort[i], i];
    }
    toSort.sort(function(left, right) {
    return left[0] < right[0] ? -1 : 1;
    });
    toSort.sortIndices = [];
    for (var j = 0; j < toSort.length; j++) {
        toSort.sortIndices.push(toSort[j][1]);
        toSort[j] = toSort[j][0];
    }
    return toSort;
}

//returns an array of all the indices of the sorted faces
function Zbuffer(verts,faces,cam){
    var arr = [];
    for(var i=0;i<faces.length;i++){
        var c = distance(faceCenter(verts,faces,i),cam);
        arr[i] = c;
    }
    sortWithIndeces(arr);
    return arr.sortIndices;
}

//still working on it 
/*function addObj2(object1,object2){
    var numVerts = object1[0].length;
    var numNewVerts = object2[0].length;
    var numNewFaces = object2[1].length;
    
    var obj1 = object1;
    var obj2 = object2;
    
    for (i=0;i<numNewVerts;i++){
        obj1[0][i+numVerts] = obj2[0][i];
    }
    
    for (i=0;i<numNewFaces;i++){
        obj1[1][i+numVerts] = [];
        for (j=0;j<obj2[1][i].length;j++){
            obj1[1][i+numVerts][j] = obj2[1][i][j]+numVerts;
        }
    }
    
    return obj1;
}*/