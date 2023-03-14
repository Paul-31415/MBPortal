import * as PIXI from "pixi.js";
import * as THREE from "three";
import { FreeCam, MarbleCam, Controler } from "./controlers";
import { Marble } from "./marble";
import { Point, Plane, Sphere, ConvexPoly, Point2D, ConvexHull, AffineTransform, Box } from "./3dTypes";
import { ColMesh, ArrayCol, ColDist } from "./physics";
import { df_Tri, df_invert, df_transform } from "./distanceFunctions";
import { CubeMarcher } from "./cubeMarcher";
import { Dif, DifReader } from "./difLoader";

//from getting started in the docs
var fov = 75;
let three_scene = new THREE.Scene();
let three_camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
let three_renderer = new THREE.WebGLRenderer({ alpha: true });
three_renderer.setSize(window.innerWidth, window.innerHeight);
three_renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

let dTHREE = THREE;

var player = new Marble(new Point(0, 2, 0));
var pcam = new MarbleCam(three_camera, player);
three_scene.add(player.object);



//skybox
{
    const loader = new dTHREE.CubeTextureLoader();
    const texture = loader.load([
        'resources/skies/sky_RT.jpg',
        'resources/skies/sky_LF.jpg',
        'resources/skies/sky_UP.jpg',
        'resources/skies/sky_DN.jpg',
        'resources/skies/sky_FR.jpg',
        'resources/skies/sky_BK.jpg',

    ]);
    three_scene.background = texture;
}





//cube from docs
var geometry = new THREE.BoxGeometry(100, .1, 1000);
var texture = new THREE.TextureLoader().load("resources/tmp/friction_high.jpg");
var material = new THREE.MeshStandardMaterial({ map: texture });
var cube = new THREE.Mesh(geometry, material);

/*sphere
var sphereDF = new df_transform(new Sphere(new Point(0, 0, 4), 2), new AffineTransform(new Point(2, 0, 0), new Point(0, 1, 0), new Point(0, 0, 3), new Point(0, 0, 0)));
var sphereBox = sphereDF.boundingBox;
var sphereGeo = new CubeMarcher(sphereDF).march(sphereBox.low.lerp(sphereBox.high, .5), sphereBox.high.sub(sphereBox.low).scaleEq(.6), sphereBox.high.sub(sphereBox.low).scaleEq(1 / 30))//sphereDF.pos, sphereDF.r + 1, (sphereDF.r + 1) / 64); 
var sphere = new THREE.Mesh(sphereGeo, material)
sphereGeo.computeVertexNormals();
cube.children.push(sphere);
*/


//box
var boxDF = new df_transform(new Box(new Point(0, 0, 0), new Point(1, 1, 1)),
    new AffineTransform(new Point(2, 0, 0), new Point(0, 1, 0), new Point(0, 0, 3), new Point(0, 0, 0)));
var boxbox = boxDF.boundingBox;
var boxgeo = new CubeMarcher(boxDF).march(boxbox.low.lerp(boxbox.high, .5), boxbox.high.sub(boxbox.low).scaleEq(.6), boxbox.high.sub(boxbox.low).scaleEq(1 / 30));
boxgeo.computeVertexNormals();
var box = new THREE.Mesh(boxgeo, material);
//cube.children.push(box);

//triangle
/*
var triDF = new df_Tri(new Point(-1, 1.1, -1), new Point(-1, 1.1, 2), new Point(2, 1.1, -1));
var triGeo = new THREE.BufferGeometry();
triGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(triDF.getTriangles()), 3));
var tri = new THREE.Mesh(triGeo, new THREE.MeshStandardMaterial({ color: 0x22aa00 }));
triGeo.computeVertexNormals();
cube.children.push(tri);
//triangle2
var tri2DF = new df_Tri(new Point(-1, 2.1, 2), new Point(-1, 1.1, 2), new Point(2, 1.1, -1));
var tri2Geo = new THREE.BufferGeometry();
tri2Geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tri2DF.getTriangles()), 3));
var tri2 = new THREE.Mesh(tri2Geo, new THREE.MeshStandardMaterial({ color: 0x22aa00 }));
tri2Geo.computeVertexNormals();
cube.children.push(tri2);
*/

import * as fs from "fs";
import { Interior } from "./difFinalizers";


var cm = new ArrayCol([new ColMesh(cube)]);//, new ColDist((boxDF))]);//, new ColDist(triDF), new ColDist(tri2DF)]);





/*let intDF = ;

for (var i = 0; i < intDF.planes.length - 3; i++) {
    let o = intDF.planes[i].normal.scale(intDF.planes[i].distance);
    let vs = [new Point(0, 0, 0), new Point(10, 0, 0), new Point(0, 10, 0), new Point(0, 0, 10)];
    let verts: number[] = [];
    for (let v of vs) {
        v.subEq(o).removeComponentEq(intDF.planes[i].normal).addEq(o);
    }
    for (let v of [0, 1, 2, 1, 2, 3, 0, 1, 3, 0, 2, 3]) {
        verts.push(...vs[v].xyz);
    }
    let g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    g.computeVertexNormals();
    cube.children.push(new THREE.Mesh(g, material));
}
*/



function fibSphere(n: number, d: number): Plane[] {

    let points: Plane[] = [];
    for (let i = 0; i < n; i++) {
        let y = i * 2 / n - 1 + 1 / n;
        let phi = i * Math.PI * (3 - 2 ** .5);
        let r = Math.sqrt(1 - y * y);
        points.push(new Plane(new Point(Math.cos(phi) * r, y, Math.sin(phi) * r), d));
    }
    return points;
}

function fibSpherePoints(n: number, d: number): Point[] {

    let points: Point[] = [];
    for (let i = 0; i < n; i++) {
        let y = i * 2 / n - 1 + 1 / n;
        let phi = i * Math.PI * (3 - 2 ** .5);
        let r = Math.sqrt(1 - y * y);
        points.push(new Point(Math.cos(phi) * r, y, Math.sin(phi) * r).scale(d));
    }
    return points;
}

//let d = new DifReader(fs.readFileSync("/Users/paul/Projects/MarbleBlastWithPortals/app/resources/data/interiors/beginner/test.dif")).parse();

//d.interiors[0].graphic(cube);



//let intDF = /*new ConvexPoly(new Plane(new Point(0, 2, 0), .3));*/new ConvexHull(true);
/*intDF.setFromPlanes(/*new Plane(new Point(0, 0, -1), .625),
    new Plane(new Point(-1, 0, 0), 8),
    new Plane(new Point(-0.7071068286895752, -0.7071068286895752, 0), 7.326048851013184),
    new Plane(new Point(-0.7071068286895752, 0.7071068286895752, 0), 7.407234191894531),
    new Plane(new Point(0, 1, 0), 3.5),
    new Plane(new Point(0, 0, 1), .875));*/

//...fibSphere(10, 2));// */new Plane(new Point(1, 0, 0), 2), new Plane(new Point(0, 1, 0), 2), new Plane(new Point(0, 0, 1), 2), new Plane(new Point(-1, 0, 0), 2), new Plane(new Point(0, -1, 0), 2), new Plane(new Point(0, 0, -1), 2), new Plane(new Point(0, .5 ** .5, .5 ** .5), 2));
//intDF.setFromLines(new Point(1, 1, -1), new Point(-1, 1, -1), new Point(1, -1, -1), new Point(-1, -1, -1));

//intDF.addPoints(...fibSpherePoints(10, 2));

//intDF.addPoints(new Point2D(1, -1).normEq(), new Point2D(-1, 1).normEq(), new Point2D(1, 1).normEq(), new Point2D(-1, -1).normEq());
//intDF.addPoints(new Point2D(1, 0), new Point2D(-1, 0), new Point2D(0, 1), new Point2D(0, -10));
//debugger;

//intDF.wireframe(cube);
//let bb = intDF.boundingBox;
//let r = bb.high.sub(bb.low);
/*
let intMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
intMat.side = THREE.DoubleSide;
let intGeo = intDF.geometry();//* /new CubeMarcher(intDF).march(new Point(0, 0, 0), new Point(2.5, 2.5, 2.5), 0.0225);
intGeo.computeVertexNormals();
let intG = new THREE.Object3D();
let int = new THREE.Mesh(intGeo, intMat);
intG.children.push(int);
cm.objs.push(new ColDist(intDF));

//cube.children.push(intG);

function tria(p: Plane): THREE.BufferGeometry {
    let g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...p.fromUVW(new Point(0, 0, 0)).xyz, ...p.fromUVW(new Point(3, 0, 0)).xyz, ...p.fromUVW(new Point(0, 3, 0)).xyz]), 3));
    return g;
}
for (let i = 0; i < 0/*d.interiors[0].planes.length/* 0/*d.interiors[0].convexHulls.length* /; i++) {
    //cube.children.push(new THREE.Mesh(tria(d.interiors[0].planes[i]), intMat));
}
console.log(intDF);
*/




/*
//testInterior
let ti = new Interior();
ti.planes = [new Plane(new Point(0, 1, 0), -1)]//, new Plane(new Point(0, 1, 0.1), -1), new Plane(new Point(0.1, 1, 0.1), -1), new Plane(new Point(0, -1, 0), 3)];
ti.bounding_box = { low: new Point(-100, -10, -100), high: new Point(100, 10, 100), contents: {} };
let tibb = ti.boundingBox();
let tir = tibb.high.sub(tibb.low);
let tiGeo = new CubeMarcher(ti).march(tibb.low.lerp(tibb.high, .5), tir.scale(.5), Math.max(...tir.xyz) / 50);
let tiMat = new THREE.MeshStandardMaterial({ color: 0x808080 })
tiGeo.computeVertexNormals();
let tint = new THREE.Mesh(tiGeo, tiMat);

cube.children.push(tint);
cm.objs.push(new ColDist(ti));

//*/




//portal

let squareGeometry = new THREE.BufferGeometry();
squareGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array([
    -1.0,  1.0, 0.0,
    1.0,  1.0, 0.0,
    1.0, -1.0, 0.0,
	-1.0, -1.0, 0.0]),3));
squareGeometry.setIndex([0,2,1,0,3,2]);
squareGeometry.setAttribute("uv",new THREE.BufferAttribute(new Float32Array([
    0,1, 1,1, 1,0, 0,0,]),2));


let port1rts = [new THREE.WebGLRenderTarget(512,512),new THREE.WebGLRenderTarget(512,512)];//width height
let port1cam = new THREE.PerspectiveCamera(1,1);


let squareMaterial = new THREE.MeshBasicMaterial({map: port1rts[1].texture});
let squareMaterial2 = new THREE.MeshBasicMaterial({map: port1rts[1].texture});
let squareMesh = new THREE.Mesh( squareGeometry, squareMaterial );
squareMesh.position.copy(new THREE.Vector3(2,1,3));
squareMesh.scale.copy(new THREE.Vector3(3,3,3));
squareMesh.quaternion.fromArray([1,2,3,4],0).normalize();
squareMesh.updateMatrix();
three_scene.add(squareMesh);

let squareMesh2 = new THREE.Mesh( squareGeometry, squareMaterial2 );
squareMesh2.position.copy(new THREE.Vector3(2,1,5));
//squareMesh2.scale.copy(new THREE.Vector3(3,3,3));
squareMesh2.quaternion.fromArray([0,1,0,0],0).normalize();
squareMesh2.updateMatrix();
three_scene.add(squareMesh2);
class portalRenderer{
    rts:[THREE.WebGLRenderTarget,THREE.WebGLRenderTarget];
    cam:THREE.PerspectiveCamera;
    constructor(/*public self:THREE.Object3D,public other:THREE.Object3D,*/public transform:AffineTransform,w=512,h=512,public meshWidth=2,public meshHeight=2){
	
	this.rts = [new THREE.WebGLRenderTarget(w,h),new THREE.WebGLRenderTarget(w,h)];
	this.cam = new THREE.PerspectiveCamera();
    }
    epsilon = -1e-4;
    prerender(mesh:THREE.Mesh,dest:THREE.Mesh,scene=three_scene,cam=three_camera){
	//let mat = this.transform.v;
	//let mat = this.self.matrixWorld / this.other.matrixWorld;
	//
        //
        let material = mesh.material;
	material.map = this.rts[1].texture;
	three_renderer.setRenderTarget(this.rts[0]);

        let mat = new THREE.Matrix4().copy(mesh.matrixWorld);
        mat.invert();
        
        this.cam.position.copy(cam.position).applyMatrix4(mat);
        this.cam.filmGauge = this.meshWidth;
        this.cam.setFocalLength(this.cam.position.z);
        this.cam.setViewOffset(this.meshWidth,this.meshHeight,-this.cam.position.x,this.cam.position.y,this.meshWidth,this.meshHeight);
        this.cam.near = this.cam.position.z+this.epsilon;
        this.cam.updateProjectionMatrix();

        //mat.invert();
        //
        //mat.multiply(dest.matrixWorld);
        //mat.setPosition(0,0,0);
        //this.cam.projectionMatrix.premultiply(mat);

        mat.makeRotationY(Math.PI);
        //mat.copy(mesh.matrixWorld);
        mat.premultiply(dest.matrixWorld);

        //mat.elements[8] *= -1;
        //mat.elements[9] *= -1;
        //mat.elements[10] *= -1;
        //mat.elements[11] *= -1;
        
        //mat.elements[12] *= -1;
        //mat.elements[13] *= -1;
        //mat.elements[14] *= -1;
        //mat.elements[15] *= -1;
        
        this.cam.position.applyMatrix4(mat);
        
        mat.setPosition(0,0,0);
        mat.invert();
        this.cam.projectionMatrix.multiply(mat);
        //mat.invert();

        
        
        
        //this.cam.copy(cam);
	//this.cam.matrixWorld.copy(camMat);
	//this.cam.projectionMatrix.copy(cam.projectionMatrix);
        
        
	//this.cam.projectionMatrix.compose(

        //let v = dest.visible;
        //dest.visible = false;
        
	three_renderer.render(scene,this.cam);
	three_renderer.setRenderTarget(null);
	material.map = this.rts[0].texture;

        //dest.visible = v;
        
	let a = this.rts.pop();let b = this.rts.pop();
	this.rts.push(a,b);
    }
    /*
    port1cam.copy(three_camera);
    port1rts = [port1rts[1],port1rts[0]];
    squareMaterial.map = port1rts[1].texture;
    three_renderer.setRenderTarget(port1rts[0]);
    three_renderer.render(three_scene, port1cam);
    three_renderer.setRenderTarget(null);
    squareMaterial.map = port1rts[0].texture;
    three_renderer.render(three_scene, three_camera);
    oldTime = time;
    */
    
    
    
    
}

let portal = new portalRenderer(new AffineTransform(),1024,1024);
let portal2 = new portalRenderer(new AffineTransform(),1024,1024);

    



















pcam.world = cube;
player.world = cm;
player.timeRate = 0;

three_scene.add(player.debugObject);


three_camera.position.z = 5;

three_scene.add(new THREE.AmbientLight(0x404040));
let dl = new THREE.DirectionalLight(0x808080);
three_scene.add(dl);
dl.position.x = 1;
dl.position.z = 2;
dl.position.y = 3;

three_scene.add(cube);





let pixi_renderer = PIXI.autoDetectRenderer({ transparent: true });

const app: PIXI.Application = new PIXI.Application(
    {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        transparent: true,
        resolution: window.devicePixelRatio || 1,
        autoResize: true
    }
);

var saveDirectory = "./saves/";

three_renderer.domElement.id = "three";
app.view.id = "pixi";
document.body.appendChild(three_renderer.domElement);
document.body.appendChild(app.view);




//app.stage.addChild(view);

window.onresize = function(_event: UIEvent): void {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    three_renderer.setSize(window.innerWidth, window.innerHeight);
    three_camera.aspect = window.innerWidth / window.innerHeight;
    three_camera.fov = (three_camera.aspect > 1) ? fov / three_camera.aspect : fov;
    three_camera.updateProjectionMatrix();

};


const freecam = new FreeCam(three_camera);
pcam.attach(document);
var activeControler: Controler = pcam;
const fpsMeter = new PIXI.Text("FPS:__");

fpsMeter.y = 20;
fpsMeter.x = 20;

app.stage.addChild(fpsMeter);

var oldTime = 0;
var fps = 0;
var fpsa = 0.01;
var spf = 0;
var spfa = .01;
function physLoop(delta: number): void {
    //time += delta;
    //delta /= 60;

    activeControler.physics(delta);
    player.physics(delta);
    fpsMeter.text = "err:" + player.timeError.toFixed(6);
    //fps = fps * (1 - fpsa) + (60 / delta) * fpsa;
    //fpsMeter.text = "FPS:" + fps;
}




//app.ticker.add(physLoop);
var debugPath = new THREE.BufferGeometry();
let lm = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 4 });
var debugLine = new THREE.Line(debugPath, lm);
{
    three_scene.add(debugLine);
}

var randPlanes: Point[] = [];
for (let i = 0; i < 10; i++) {
    randPlanes.push(new Point(Math.random() - .5, Math.random() - .5, Math.random() - .5));
}
/*var debugGon = new ConvexPoly(...randPlanes);

var debugG = new PIXI.Graphics();
debugG.lineColor = 0x0000ff;
let pts = debugGon.geometry();
debugG.moveTo(pts[pts.length - 1].x * 1 + 400, pts[pts.length - 1].y * 1 + 400);
for (let p of pts) {
    debugG.lineTo(p.x * 1 + 400, p.y * 1 + 400);
}
debugG.lineWidth = 3;
app.stage.addChild(debugG);
var debugGL = new PIXI.Graphics();
debugGL.lineColor = 0xff0000;
app.stage.addChild(debugGL);
debugGL.lineWidth = 3;
let mp = { x: 0, y: 3 };
*/
function animate(time: number) {
    requestAnimationFrame(animate);
    let dt = (time - oldTime) / 1000;
    physLoop(dt);
    player.animate(time);
    activeControler.animate(time);

    //debugger
    debugLine.children = [];
    //debugPath.setFromPoints([player.position.v, intDF.gradient(player.position).normEq(-intDF.eval(player.position)).v]);
    /*debugGL.clear();
    mp.x += mp.y / 100;
    mp.y -= mp.x / 100;
    debugGL.moveTo(mp.x * 1 + 400, mp.y * 1 + 400);
    let np = debugGon.closestPointAndLine(mp)[0];
    debugGL.lineTo(np.x * 1 + 400, np.y * 1 + 400)
    //let debugCube = new ConvexHull(new Plane(new Point(1, 0, 0), 1), new Plane(new Point(0, 1, 0), 1), new Plane(new Point(0, 0, 1), 1), new Plane(new Point(-1, 0, 0), 1), new Plane(new Point(0, -1, 0), 1), new Plane(new Point(0, 0, -1), 1));
    */
    let p = Point;


    spf = spf * (1 - spfa) + spfa * dt;


    fpsMeter.text += "time:" + (time / 1000).toFixed(6) + "\nfps:" + (1 / (dt)).toFixed(2) + "\navgFps:" + (1 / spf).toFixed(2)
        + "\nonGround:" + player.onGround + "\n" + player.groundNormal.x + "\n" + player.groundNormal.y + "\n" + player.groundNormal.z;
    ;
    fpsMeter.text += "\npos:" + player.position.func(function(x: number): number { return Math.floor(x * 100) / 100 }).xyz;


    portal.prerender(squareMesh,squareMesh2);
    portal2.prerender(squareMesh2,squareMesh);
    //port1cam.copy(three_camera);
    //port1rts = [port1rts[1],port1rts[0]];
    //squareMaterial.map = port1rts[1].texture;
    //three_renderer.setRenderTarget(port1rts[0]);
    //three_renderer.render(three_scene, port1cam);
    //three_renderer.setRenderTarget(null);
    //squareMaterial.map = port1rts[0].texture;
    three_renderer.render(three_scene, three_camera);
    oldTime = time;
}
animate(0);


const keyCallbacks: any = {
    "F8": function() {
        activeControler.detach();
        activeControler = freecam;
        activeControler.attach(document);
        freecam.mattach(document);
    },
    "F7": function() {
        activeControler.detach();
        player.position.v = freecam.cam.position;
        player.velocity.xyz = [0, 0, 0];
        activeControler = pcam;
        activeControler.attach(document);
    },
    "F12": function() {
        debugger;
        /*intDF.planes = [new Plane(new Point(0, -1, 0), 10), new Plane(new Point(.1, 1, 0), 0), new Plane(new Point(-.1, 1, -.1), 0), new Plane(new Point(-.1, 1, .1), 0)];
          intDF.setup();*/
        //intDF.addPoints(new Point(Math.random() * 2, Math.random() * 2, Math.random() * 2));
        //intGeo = intDF.geometry();//*/new CubeMarcher(intDF).march(new Point(0, 0, 0), new Point(2.5, 2.5, 2.5), 0.0225);
        //intGeo.computeVertexNormals();
        //intG.children = [];
        //let int = new THREE.Mesh(intGeo, intMat);
        //intG.children.push(int);
        //intDF.addPoints(new Point2D(1, 0), new Point2D(-1, 0), new Point2D(0, 1), new Point2D(0, -10));
        //int.geometry = intDF.geometry();

    }
}
function keyPressedCallback(ke: KeyboardEvent) {
    if (keyCallbacks[ke.code] != null) {
        keyCallbacks[ke.code]()
    }
}
document.addEventListener("keydown", keyPressedCallback);












