"use strict";
var renderer, scene, cam, stats;
var blackhole;
var height = 1;
var dist = 1;
var lat = 0, lon = 0;
var particles, particleSystem, particleMaterial;
var ar = (window.innerWidth/window.innerHeight);
var scale = 20;
var boxSize = [scale*1.5, scale*1.5, scale*ar];

var options = {
    camFollow: 'Comet',
    count: 200000,
    // count: 512,
    particleSpeedMult: 0.01,
    drag: 0.0165,
    size: 0.02,
    color: [255,255,255],

    boxSize: 20,

    gravity: 1.7,
    gravitySize: 25,
    blackHoleSpeedMult: 0.2,
    cometMaxSpeed: 0.5
};

init();
createGUI();
createParticles(options.count);
doFrame();

function init(){
    renderer = new THREE.WebGLRenderer({alpha : true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor( 0x888888, 0);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(255,255,255);
    cam = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

    cam.position.set(-scale, height, 0);
    cam.lookAt(scene.position);

    var axis = new THREE.AxisHelper(scale/2);
    // scene.add(axis);

    var cubegeo = new THREE.CubeGeometry(boxSize[0], boxSize[1], boxSize[2]);
    var cubemat = new THREE.MeshBasicMaterial( { color: 0x555555, wireframe: true});
    var cube = new THREE.Mesh(cubegeo, cubemat);
    // scene.add(cube);

    var blackholegeo = new THREE.SphereGeometry(scale / 200, 10, 10, 0, Math.PI*2, 0, Math.PI);
    var blackholetexture = new THREE.TextureLoader().load('./img/phobos2k.jpg');
    var blackholemat = new THREE.MeshBasicMaterial({ /*color: 0x000000,*/ map: blackholetexture});
    blackhole = new THREE.Mesh(blackholegeo, blackholemat);
    blackhole.velocity = new THREE.Vector3(Math.random()*options.cometMaxSpeed, Math.random()*options.cometMaxSpeed, Math.random()*options.cometMaxSpeed);
    scene.add(blackhole);

    var skyboxmap = ["right1.png","left2.png","top3.png","bottom4.png","front5.png","back6.png"];
    var skybox = new THREE.CubeTextureLoader().setPath('img/background/nebula_').load(skyboxmap);
    skybox.format = THREE.RGBFormat;
    skybox.mapping = THREE.CubeReflectionMapping;
    scene.background = skybox;


    stats = new Stats();
    stats.showPanel(0);
    // document.body.appendChild(stats.dom);
}

function createGUI(){
    var gui = new dat.GUI();

    var interactionFolder = gui.addFolder("Mouse Interaction");
    var mousecam = interactionFolder.add(options, "camFollow", ['Fixed', 'Rotate', 'Comet']).name("Camera Type");
    mousecam.onFinishChange(function(val){
       setCamFollow(val);
    });

    var particleFolder = gui.addFolder("Particles");
    var countcontroller = particleFolder.add(options, 'count', 100, 300000).name("Count");
    countcontroller.onFinishChange(function(value){
        createParticles(value);
    });

    var sizecontroller = particleFolder.add(options, 'size', 0.01, 0.05).name("Size");
    sizecontroller.onFinishChange(function(size){
       setSize(size);
    });

    var colorController = particleFolder.addColor(options, 'color', [255,255,255]).name("Color");
    colorController.onFinishChange(function(color){
        changeColor(color);
    });

    particleFolder.add(options, 'particleSpeedMult', 0.001, 0.1).name("Speed Multiplier");
    particleFolder.add(options, 'drag', 0.0, 0.025).name("Drag");

    var blackHoleFolder = gui.addFolder("Comet");

    blackHoleFolder.add(options, 'gravity', 0.1, 2.5).name("Gravity Force");
    blackHoleFolder.add(options, 'gravitySize', 1.0, 50.0).name("Gravity Radius");
    blackHoleFolder.add(options, 'blackHoleSpeedMult', 0.01, 0.5).name("Speed Multiplier");


    particleFolder.open();
    blackHoleFolder.open();
    // gui.add(options, 'color', "#ffffff");
    // gui.add(options, 'gravity', 0.2);
    gui.close();
}

function createParticles(count){
    particles = new THREE.Geometry();
    if(typeof particleSystem != "undefined") {
        scene.remove(particleSystem);
        particles.verticesNeedUpdate = true;
        render();
    }
    for(var p=0; p<count-particles.vertices.length; p++){
        var x = Math.random() * boxSize[0] - (boxSize[0]/2);
        var y = Math.random() * boxSize[1] - (boxSize[1]/2);
        var z = Math.random() * boxSize[2] - (boxSize[2]/2);
        var particle = new THREE.Vector3(x,y,z);
        particle.velocity = new THREE.Vector3(Math.random(), Math.random(), Math.random());
        particles.vertices.push(particle);
        particles.colors.push(new THREE.Color(options.color[0], options.color[1], options.color[2]));
    }
    particles.verticesNeedUpdate = true;
    particleMaterial = particleMaterial || new THREE.PointsMaterial( {
        size: options.size,
        vertexColors: THREE.VertexColors,
        map: THREE.ImageUtils.loadTexture("./img/circle.png"),
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    particleMaterial.alphaTest = 0.5;
    particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
}

function changeColor(color){
    color[0] /= 255;
    color[1] /= 255;
    color[2] /= 255;
    options.color = color;
    for(var p=0; p<particles.colors.length; p++){
        particles.colors[p].setRGB(color[0], color[1], color[2]);
    }
    particles.colorsNeedUpdate = true;
    // particleMaterial.color.set(new THREE.Color(color[0], color[1], color[2]));
    // particleMaterial.colorsNeedUpdate = true;
    render();
}

function setSize(size){
    particleMaterial.size = size;
}

function doFrame(){
    stats.begin();

    for(var p=0; p<particles.vertices.length; p++){
        var particle = particles.vertices[p];

        doReflect(particle);
        doGravity(particle, blackhole);
        doMove(particle, options.particleSpeedMult, true);

        particles.colors[p].setRGB(particle.velocity.x, particle.velocity.y, particle.velocity.z);
    }

    doMove(blackhole, options.blackHoleSpeedMult, false);
    if(options.camFollow === 'Comet'){
        camFollow(blackhole);
    }
    doReflect(blackhole);

    blackhole.geometry.verticesNeedUpdate = true;
    particleSystem.geometry.verticesNeedUpdate = true;
    render();
    stats.end();
    requestAnimationFrame(doFrame);
}

function doGravity(particle, gravSource){
    var dist = particle.distanceTo(gravSource.position);
    var acceleration = options.gravity * boxSize[1]/2 * 0.066726 / Math.pow(dist,2);
    if(acceleration > 1/options.gravitySize){
        var vecToCentre = new THREE.Vector3().subVectors(particle, gravSource.position);
        particle.velocity = new THREE.Vector3().subVectors(particle.velocity, vecToCentre.multiplyScalar(acceleration));
    }

    var velocityScale = particle.velocity.length() / boxSize[1];
    if(velocityScale > 1){
        particle.velocity.multiplyScalar(1/velocityScale);
    }
}

function doReflect(particle) {
    if(particle.x && particle.y && particle.z){
        if(particle.x > boxSize[0]/2){
            particle.velocity.reflect(new THREE.Vector3(-1,0,0));
        }
        if(particle.x < -boxSize[0]/2){
            particle.velocity.reflect(new THREE.Vector3(1,0,0));
        }
        if(particle.y > boxSize[1]/2){
            particle.velocity.reflect(new THREE.Vector3(0,-1,0));
        }
        if(particle.y < -boxSize[1]/2){
            particle.velocity.reflect(new THREE.Vector3(0,1,0));
        }
        if(particle.z > boxSize[2]/2){
            particle.velocity.reflect(new THREE.Vector3(0,0,-1));
        }
        if(particle.z < -boxSize[2]/2){
            particle.velocity.reflect(new THREE.Vector3(0,0,1));
        }
    }else{
        if(particle.position.x > boxSize[0]/2){
            particle.velocity.reflect(new THREE.Vector3(-1,0,0));
        }
        if(particle.position.x < -boxSize[0]/2){
            particle.velocity.reflect(new THREE.Vector3(1,0,0));
        }
        if(particle.position.y > boxSize[1]/2){
            particle.velocity.reflect(new THREE.Vector3(0,-1,0));
        }
        if(particle.position.y < -boxSize[1]/2){
            particle.velocity.reflect(new THREE.Vector3(0,1,0));
        }
        if(particle.position.z > boxSize[2]/2){
            particle.velocity.reflect(new THREE.Vector3(0,0,-1));
        }
        if(particle.position.z < -boxSize[2]/2){
            particle.velocity.reflect(new THREE.Vector3(0,0,1));
        }
    }
}

function doMove(particle, speedFactor, hasDrag){
    if(particle.x && particle.y && particle.z){
        particle.x += particle.velocity.x * speedFactor;
        particle.y += particle.velocity.y * speedFactor;
        particle.z += particle.velocity.z * speedFactor;
    }else{
        particle.position.x += particle.velocity.x * speedFactor;
        particle.position.y += particle.velocity.y * speedFactor;
        particle.position.z += particle.velocity.z * speedFactor;
    }
    if(hasDrag) {
        particle.velocity.x *= 1 - options.drag;
        particle.velocity.y *= 1 - options.drag;
        particle.velocity.z *= 1 - options.drag;
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
    if(options.camFollow === 'Rotate'){
        rotate(lat,lon);
    }
}

renderer.domElement.addEventListener("mousemove", mouseLook, false);
function mouseLook(event){
    if(options.camFollow !== 'Rotate') return;
    var width = renderer.getSize().width;
    var mousex = event.clientX - (width / 2);
    lat = mousex / width * 2;
    var height = renderer.getSize().height;
    var mousey = event.clientY - (height / 2);
    lon = mousey / height * 2;

    rotate(lat, lon);
}

function setCamFollow(val) {
    if(val === 'Fixed') {
        cam.position.x = -scale / 2;
        cam.position.z = 0;
        cam.position.y = 0;
        cam.lookAt(scene.position);
        cam.updateProjectionMatrix();
    }
}

function rotate(lat, lon){
    // -1 <= val <= 1
    // if(lat > 0.75) lat = 0.75;
    // else if(lat < -0.75) lat = -0.75;
    // if(lon > 0.1) lon = 0.1;
    // if(lon < -0.1) lon = -0.1;
    lat *= 0.75;
    lon *= 0.5;

    cam.position.x = -scale/2 * Math.cos(lat) * dist;
    cam.position.z = boxSize[1] * Math.sin(lat) * dist;
    cam.position.y = -scale/2 * Math.sin(lon) * dist;
    cam.lookAt(scene.position);
    cam.updateProjectionMatrix();
}

window.addEventListener("resize", windowResize, false);
function windowResize(){
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function camFollow(object){
    var pos = object.position;
    var vel = object.velocity;

    cam.position.x = (pos.x + (-vel.x * (dist*25))) * Math.cos(lat);
    cam.position.y = (pos.y + (-vel.y * (dist*25))) * Math.sin(lat);
    cam.position.z = (pos.z + (-vel.z * (dist*25))) * Math.sin(lon);
    cam.lookAt(pos);
}