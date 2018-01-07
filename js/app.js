"use strict";
var renderer, scene, cam, stats;
var comet;

var blackHoles = [];

var height = 1;
var dist = 1;
var lat = 0, lon = 0;
var particleGeometry, particleSystem, particleMaterial;

var options = {
    // count: 10,
    count: 5120,
    particleSpeedMult: 0.01,
    drag: 0.0165,
    size: 0.001,
    color: [0.25,0.25,0.25],

    boxSize: 20,

    gravity: 1.5,
    gravitySize: 25,
    cometSpeedMult: 0.2,
    cometSize: 1,

    blackHoleCount: 5,

    ttl: 60,
    particleMethod: 'EMIT'
};

init();
createGUI();
doFrame();

function init() {
    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x888888, 0);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(255, 255, 255);
    cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    cam.position.set(-options.boxSize, height, 0);
    cam.lookAt(scene.position);

    // var axis = new THREE.AxisHelper(options.boxSize/2);
    // scene.add(axis);

    var cubegeo = new THREE.CubeGeometry(options.boxSize, options.boxSize, options.boxSize);
    var cubemat = new THREE.MeshBasicMaterial({color: 0x555555, wireframe: true});
    var cube = new THREE.Mesh(cubegeo, cubemat);
    scene.add(cube);

    var cometgeo = new THREE.SphereGeometry(0.25, 10, 10, 0, Math.PI * 2, 0, Math.PI);
    var comettexture = new THREE.TextureLoader().load('./img/phobos2k.jpg');
    var cometmat = new THREE.MeshBasicMaterial({transparent: true, map: comettexture});
    comet = new THREE.Mesh(cometgeo, cometmat);
    comet.velocity = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    comet.scale.set(options.cometSize, options.cometSize, options.cometSize);
    scene.add(comet);

    var skyboxmap = ["right1.png", "left2.png", "top3.png", "bottom4.png", "front5.png", "back6.png"];
    var skybox = new THREE.CubeTextureLoader().setPath('./img/background/nebula_').load(skyboxmap);
    skybox.format = THREE.RGBFormat;
    skybox.mapping = THREE.CubeReflectionMapping;
    scene.background = skybox;


    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    createBlackHoles(options.blackHoleCount);

    if (options.particleMethod !== 'EMIT') {
        createParticles(options.count);
    }else{
        createEmittedParticles(options.count);
    }
}

function createGUI(){
    var gui = new dat.GUI();
    var particleFolder = gui.addFolder("Particles");
    var countcontroller = particleFolder.add(options, 'count', 100, 75000).name("Count");
    countcontroller.onFinishChange(function(value){
        if(options.particleMethod === 'EMIT'){
            createEmittedParticles(value);
        }else{
            createParticles(value);
        }
    });

    // var sizecontroller = particleFolder.add(options, 'size', 0.01, 0.05).name("Size");
    // sizecontroller.onFinishChange(function(size){
    //    setSize(size);
    // });

    var colorController = particleFolder.addColor(options, 'color', [255,255,255]).name("Color");
    colorController.onFinishChange(function(color){
        changeColor(color);
    });

    particleFolder.add(options, 'particleSpeedMult', 0.001, 0.025).name("Speed Multiplier");
    particleFolder.add(options, 'drag', 0.0, 0.025).name("Drag");
    particleFolder.open();


    var blackHoleFolder = gui.addFolder("Black Holes");
    blackHoleFolder.open();
    blackHoleFolder.add(options, 'blackHoleCount', 0, 10, 1).name("Count").onFinishChange(function(count){
        createBlackHoles(count);
    });
    blackHoleFolder.add(options, 'gravity', 0.1, 2.5).name("Gravity Strength");
    blackHoleFolder.add(options, 'gravitySize', 1.0, 50.0).name("Pull Radius");


    var cometFolder = gui.addFolder("Comet");

    cometFolder.add(options, 'cometSpeedMult', 0.01, 0.5).name("Speed Multiplier");
    cometFolder.add(options, 'cometSize', 0.1, 1).name("Size").onFinishChange(function (size) {
        comet.scale.set(size,size,size);
    });
    cometFolder.open();
    // gui.add(options, 'color', "#ffffff");
    // gui.add(options, 'gravity', 0.2);
}

function createBlackHoles(count){
    for(var i=0; i<blackHoles.length; i++){
        scene.remove(blackHoles[i]);
    }
    blackHoles = [];
    var blackHoleGeo = new THREE.SphereGeometry(0.25, 10, 10, 0, Math.PI * 2, 0, Math.PI);
    var blackHoleTexture = new THREE.TextureLoader().load('img/phobos2k.jpg');
    var blackHoleMat = new THREE.MeshBasicMaterial({color: 0x333333, transparent: true, map: blackHoleTexture});
    for(var i=0; i<count; i++){
        var blackHole = new THREE.Mesh(blackHoleGeo, blackHoleMat);
        blackHole.position.x = centerRandom(options.boxSize);
        blackHole.position.y = centerRandom(options.boxSize);
        blackHole.position.z = centerRandom(options.boxSize);
        scene.add(blackHole);
        blackHoles.push(blackHole);
    }
}

function createParticles(count){
    if(typeof particleSystem != "undefined") {
        particleGeometry = new THREE.BufferGeometry();
        scene.remove(particleSystem);
        particleGeometry.verticesNeedUpdate = true;
        render();
    }
    for(var p=0; p<count-particleGeometry.vertices.length; p++){
        var x = Math.random() * options.boxSize - (options.boxSize/2);
        var y = Math.random() * options.boxSize - (options.boxSize/2);
        var z = Math.random() * options.boxSize - (options.boxSize/2);
        var particle = new THREE.Vector3(x,y,z);
        particle.velocity = new THREE.Vector3(Math.random(), Math.random(), Math.random());
        particleGeometry.vertices.push(particle);
        particleGeometry.colors.push(new THREE.Color(options.color[0], options.color[1], options.color[2]));
    }
    particleGeometry.verticesNeedUpdate = true;
    particleMaterial = particleMaterial || new THREE.PointsMaterial( {
        size: options.size,
        vertexColors: THREE.VertexColors,
        map: new THREE.TextureLoader().load("./img/circle.png"),
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    particleMaterial.alphaTest = 0.5;
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

function createEmittedParticles(count){
    if(typeof particleGeometry != "undefined"){
        scene.remove(particleSystem);
    }
    particleGeometry = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var velocity = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var ttl = new Int16Array(count);
    particleGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeometry.addAttribute('velocity', new THREE.Float32BufferAttribute(velocity, 3));
    particleGeometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    particleGeometry.addAttribute('ttl', new THREE.Int16BufferAttribute(ttl, 1));
    particleGeometry.maxParticles = count;
    particleMaterial = particleMaterial || new THREE.PointsMaterial( {
        size: options.size * 10,
        vertexColors: THREE.VertexColors,
        color: 0xFFFFFF
        // map: new THREE.TextureLoader().load("./img/circle.png"),
        // blending: THREE.AdditiveBlending,
        // transparent: true
    });
    particleMaterial.alphaTest = 0.5;
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

function centerRandom(scale){
    var r = Math.random();
    return (r-0.5)*scale;
}

function emitParticle(emitter, particleNo, deviance, ttl){
    particleGeometry.attributes.position.array[particleNo*3] = emitter.position.x;// + centerRandom(deviance);
    particleGeometry.attributes.position.array[particleNo*3+1] = emitter.position.y;// + centerRandom(deviance);
    particleGeometry.attributes.position.array[particleNo*3+2] = emitter.position.z;// + centerRandom(deviance);
    particleGeometry.attributes.position.needsUpdate = true;
    var devX = centerRandom(deviance);
    var devY = centerRandom(deviance);
    var devZ = centerRandom(deviance);
    particleGeometry.attributes.velocity.array[particleNo*3] = emitter.velocity.x + devX;
    particleGeometry.attributes.velocity.array[particleNo*3+1] = emitter.velocity.y + devY;
    particleGeometry.attributes.velocity.array[particleNo*3+2] = emitter.velocity.z + devZ;
    particleGeometry.attributes.velocity.needsUpdate = true;
    particleGeometry.attributes.color.array[particleNo*3] = options.color[0] + ((1 - options.color[0]) * (devX/deviance));
    particleGeometry.attributes.color.array[particleNo*3+1] = options.color[1] + ((1 - options.color[1]) * (devY/deviance));
    particleGeometry.attributes.color.array[particleNo*3+2] = options.color[2] + ((1 - options.color[2]) * (devZ/deviance));
    particleGeometry.attributes.color.needsUpdate = true;
    particleGeometry.attributes.ttl.array[particleNo] = ttl;
    particleGeometry.attributes.ttl.needsUpdate = true;
}

function doParticleLife(particleNo){
    particleGeometry.attributes.ttl.array[particleNo]--;
    if(particleGeometry.attributes.ttl.array[particleNo] <= 0){
        emitParticle(comet, particleNo);
    }else{
        // doReflect(particleNo);
        for(var i=0;i<blackHoles.length; i++){
            doGravity(particleNo, blackHoles[i]);
        }
        doMoveParticle(particleNo, options.particleSpeedMult, true);
    }
}

function changeColor(color){
    color[0] /= 255;
    color[1] /= 255;
    color[2] /= 255;
    options.color = color;
    for(var p=0; p<particleGeometry.attributes.color.array.length; p++){
        particleGeometry.attributes.color.array[p].setRGB(color[0], color[1], color[2]);
    }
    render();
}

function setSize(size){
    particleMaterial.size = size;
}

var framesSinceEmission = 0;
function doFrame(){
    stats.begin();

    for(var p=0; p<particleGeometry.maxParticles; p++) {
        if(particleGeometry.attributes.ttl.array[p] == 0){
            if(framesSinceEmission < options.ttl / options.count) break;
            var count = options.count / options.ttl;
            for(var i=0; i<count; i++){
                emitParticle(comet, p+i, options.boxSize/2, options.ttl);
            }
            framesSinceEmission = 0;
        }
        doParticleLife(p);
        //
        // doReflect(particle);
        // doGravity(particle, comet);
        // doMove(particle, options.particleSpeedMult, true);

        // particleGeometry.colors[p].setRGB(particle.velocity.x, particle.velocity.y, particle.velocity.z);
    }

    doMove(comet, options.cometSpeedMult, false);
    doReflect(comet);

    comet.geometry.verticesNeedUpdate = true;
    particleSystem.geometry.verticesNeedUpdate = true;
    render();
    stats.end();
    framesSinceEmission++;
    requestAnimationFrame(doFrame);
}

function doGravity(particleNo, gravSource){
    var particlePosition = new THREE.Vector3(particleGeometry.attributes.position.array[particleNo*3],particleGeometry.attributes.position.array[particleNo*3+1],particleGeometry.attributes.position.array[particleNo*3+2]);
    var dist = particlePosition.distanceTo(gravSource.position);
    if(dist == 0) return;
    //Gm / r^2 = a
    var acceleration = options.gravity * options.boxSize/2 * 0.066726 / Math.pow(dist,2);
    if(acceleration > 1/options.gravitySize){
        var vecToCentre = new THREE.Vector3().subVectors(particlePosition, gravSource.position);
        var particleVelocity = new THREE.Vector3(particleGeometry.attributes.velocity.array[particleNo*3],particleGeometry.attributes.velocity.array[particleNo*3+1],particleGeometry.attributes.velocity.array[particleNo*3+2]);
        particleVelocity = new THREE.Vector3().subVectors(particleVelocity, vecToCentre.multiplyScalar(acceleration));
    }

    if(particleVelocity){
        var velocityScale = particleVelocity.length() / options.boxSize;
        if(velocityScale > 1){
            particleVelocity.multiplyScalar(1/velocityScale);
        }

        particleGeometry.attributes.velocity.array[particleNo*3] = particleVelocity.x;
        particleGeometry.attributes.velocity.array[particleNo*3+1] = particleVelocity.y;
        particleGeometry.attributes.velocity.array[particleNo*3+2] = particleVelocity.z;
    }
}

function doReflect(particle) {
    if (particle.position) {
        if (particle.position.x > options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(-1, 0, 0));
        }
        if (particle.position.x < -options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(1, 0, 0));
        }
        if (particle.position.y > options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(0, -1, 0));
        }
        if (particle.position.y < -options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(0, 1, 0));
        }
        if (particle.position.z > options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(0, 0, -1));
        }
        if (particle.position.z < -options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(0, 0, 1));
        }
    } else {
        if (particle.x > options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(-1, 0, 0));
        }
        if (particle.x < -options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(1, 0, 0));
        }
        if (particle.y > options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(0, -1, 0));
        }
        if (particle.y < -options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(0, 1, 0));
        }
        if (particle.z > options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(0, 0, -1));
        }
        if (particle.z < -options.boxSize / 2) {
            particle.velocity.reflect(new THREE.Vector3(0, 0, 1));
        }
    }
}

function doMove(particle, speedFactor, hasDrag){
    if (particle.position) {
        particle.position.x += particle.velocity.x * speedFactor;
        particle.position.y += particle.velocity.y * speedFactor;
        particle.position.z += particle.velocity.z * speedFactor;
    } else {
        particle.x += particle.velocity.x * speedFactor;
        particle.y += particle.velocity.y * speedFactor;
        particle.z += particle.velocity.z * speedFactor;
    }
    if(hasDrag) {
        particle.velocity.x *= 1 - options.drag;
        particle.velocity.y *= 1 - options.drag;
        particle.velocity.z *= 1 - options.drag;
    }
}

function doMoveParticle(particleNo, speedFactor, hasDrag){
    particleGeometry.attributes.position.array[particleNo*3] += particleGeometry.attributes.velocity.array[particleNo*3] * speedFactor;
    particleGeometry.attributes.position.array[particleNo*3+1] += particleGeometry.attributes.velocity.array[particleNo*3+1] * speedFactor;
    particleGeometry.attributes.position.array[particleNo*3+2] += particleGeometry.attributes.velocity.array[particleNo*3+2] * speedFactor;

    if(hasDrag) {
        particleGeometry.attributes.velocity.array[particleNo*3] *= 1 - options.drag;
        particleGeometry.attributes.velocity.array[particleNo*3+1] *= 1 - options.drag;
        particleGeometry.attributes.velocity.array[particleNo*3+2] *= 1 - options.drag;
    }
}


function render() {
    renderer.render(scene, cam);
}

renderer.domElement.addEventListener("wheel", mouseScroll, false)
function mouseScroll(event) {
    var scrollstep = 0.25;
    if(event.deltaY < 0 && dist >= 0.5 + scrollstep){
        dist -= scrollstep;
    }
    if(event.deltaY > 0 && dist <= 2-scrollstep){
        dist += scrollstep;
    }
}

renderer.domElement.addEventListener("mousemove", mouseLook, false);
function mouseLook(event){
    var width = renderer.getSize().width;
    var mousex = event.clientX - (width / 2);
    lat = mousex / width * 2;
    var height = renderer.getSize().height;
    var mousey = event.clientY - (height / 2);
    lon = mousey / height * 2;

    rotate(lat, lon);
}

function rotate(lat, lon){
    // -1 <= val <= 1
    cam.position.x = -options.boxSize * Math.cos(lat) * dist;
    cam.position.z = options.boxSize * Math.sin(lat) * dist;
    cam.position.y = -options.boxSize * Math.sin(lon) * dist;
    cam.lookAt(scene.position);
}

window.addEventListener("resize", windowResize, false);
function windowResize(){
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

