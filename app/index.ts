import * as PIXI from "pixi.js";
import * as THREE from "three";
import { FreeCam, MarbleCam, Controler } from "./controlers";
import { Marble } from "./marble";
import { Point } from "./3dTypes";
import { ColMesh } from "./physics";


//from getting started in the docs
var fov = 75;
let three_scene = new THREE.Scene();
let three_camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
let three_renderer = new THREE.WebGLRenderer({ alpha: true });
three_renderer.setSize(window.innerWidth, window.innerHeight);
three_renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);


var player = new Marble(new Point(0, 1.25, 0));
var pcam = new MarbleCam(three_camera, player);
three_scene.add(player.object);

//cube from docs
var geometry = new THREE.BoxGeometry(10, 1, 10);
var material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);

var cm = new ColMesh(cube);
pcam.world = cube;
player.world = cm;


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
freecam.attach(document);
var activeControler: Controler = freecam;
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


function animate(time: number) {
    requestAnimationFrame(animate);
    let dt = (time - oldTime) / 1000;
    player.animate(time);
    activeControler.animate(time);

    spf = spf * (1 - spfa) + spfa * dt;

    physLoop(dt);

    fpsMeter.text += "time:" + (time / 1000).toFixed(6) + "\nfps:" + (1 / (dt)).toFixed(2) + "\navgFps:" + (1 / spf).toFixed(2)
        + "\nonGround:" + player.onGround + "\n" + player.groundNormal.x + "\n" + player.groundNormal.y + "\n" + player.groundNormal.z;
    ;
    three_renderer.render(three_scene, three_camera);
    oldTime = time;
}
animate(0);


const keyCallbacks: any = {
    "F8": function() {
        activeControler.detach();
        activeControler = freecam;
        activeControler.attach(document);
    },
    "F7": function() {
        activeControler.detach();
        activeControler = pcam;
        activeControler.attach(document);
    }
}
function keyPressedCallback(ke: KeyboardEvent) {
    if (keyCallbacks[ke.code] != null) {
        keyCallbacks[ke.code]()
    }
}
document.addEventListener("keydown", keyPressedCallback);
