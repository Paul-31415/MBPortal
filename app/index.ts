import * as PIXI from "pixi.js";
import * as THREE from "three";

//from getting started in the docs
var fov = 75;
let three_scene = new THREE.Scene();
let three_camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
let three_renderer = new THREE.WebGLRenderer({ alpha: false });
three_renderer.setSize(window.innerWidth, window.innerHeight);
three_renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);


//cube from docs
var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);




three_camera.position.z = 5;

three_scene.add(new THREE.AmbientLight(0x404040));
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



class HackeyCamControl {
    document: Document;
    rotation: Quaternion;

    velPt = new Point();

    constructor(public cam: THREE.PerspectiveCamera, public vel = 4, public accel = 100, public drag = 50, public mouseSpeed = 0.01) {
        this.rotation = new Quaternion();
        this.boundkd = this.keyDownCallback.bind(this);
        this.boundku = this.keyUpCallback.bind(this);
        this.boundmm = this.mouseMoveCallback.bind(this);


    }

    controls: any = {
        "KeyW": { s: false, r: 1, v: new Point(0, 0, -1) },
        "KeyS": { s: false, r: 1, v: new Point(0, 0, 1) },
        "KeyA": { s: false, r: 1, v: new Point(-1, 0, 0) },
        "KeyD": { s: false, r: 1, v: new Point(1, 0, 0) },
        "Space": { s: false, r: 0, v: new Point(0, 1, 0) },
        "ShiftLeft": { s: false, r: 0, v: new Point(0, -1, 0) }
    };

    keyListener(ke: KeyboardEvent): void {
        /*if (ke.key == "[") {
            this.eyeSep -= 0.1;
        }
        if (ke.key == "]") {
            this.eyeSep += 0.1;
        }
        if (ke.key == "{") {
            this.eyeImageSep -= 0.1;
        }
        if (ke.key == "}") {
            this.eyeImageSep += 0.1;
        }
        if (ke.key == "\\") {
            this.eyeSep = 0;
        }
        */
    }
    physics(delta: number) {
        delta /= 60;
        const accelPt = new Point();

        for (var k in this.controls) {
            const c = this.controls[k];
            if (c.s) {
                switch (c.r) {
                    case 0://global coords
                        accelPt.addEq(c.v);
                        break;
                    case 1://local coords horizontally
                        const v = this.rotation.swingTwistDecomp(0, 1, 0)[1].apply(c.v);
                        accelPt.addDEq(v);
                        break;
                    case 2://full local coords
                        accelPt.addDEq(this.rotation.apply(c.v));
                        break;
                }
            }
        }

        const v = this.velPt;
        //drag
        const m = v.norm();

        if (m < this.drag * delta) {
            v.scaleEq(0);
        } else {
            v.scaleEq(1 - this.drag * delta / m);
        }
        //accel
        v.addDEq(accelPt.scaleEq(delta * this.accel));
        const vHorizMag2 = (v.x * v.x + v.z * v.z) / (v.w * v.w);
        if (vHorizMag2 > this.vel * this.vel) {
            const vHorizN = Math.sqrt(vHorizMag2) / this.vel;
            v.x /= vHorizN;
            v.z /= vHorizN;
        }
        if (Math.abs(v.y / v.w) > this.vel) {
            v.y = this.vel * v.w * Math.sign(v.y / v.w);
        }

        //apply vel
        const position = new Point(this.cam.position.x, this.cam.position.y, this.cam.position.z)


        position.addDEq(v.scale(delta));
        const s = 1.25;
        const stairSlope = function(n: number): number {
            n /= Math.PI;
            n += .5;
            const ipart = Math.floor(n / s);
            n = Math.min(ipart + 1, n - ipart * (s - 1));
            return (n - .5) * Math.PI;
        }
        const pegToStairSlope = function(n: number): number {
            n /= Math.PI;
            n += .5;
            const ipart = Math.floor(n / s);
            if (ipart + 1 < n - ipart * (s - 1)) {
                if ((n - (1 + ipart * s)) < ((s + ipart * s) - n)) {
                    n = 1 + ipart * s;
                } else {
                    n = s + ipart * s;
                }
            }
            return (n - .5) * Math.PI;
        }


        const peg = function(n: number): number {
            return Math.max(Math.min(Math.PI / 2, n), -Math.PI / 2);
        }
        this.angleY = peg(this.angleY);

        const ry = new Quaternion(-stairSlope(this.angleY), 0, 0);
        const rx = new Quaternion(0, -this.angleX, 0);
        this.rotation = rx.multiply(ry);


        this.cam.position.x = position.x;
        this.cam.position.y = position.y;
        this.cam.position.z = position.z;

        this.cam.rotation.setFromQuaternion(new THREE.Quaternion(...this.rotation.xyzw));

    }

    keyDownCallback(ke: KeyboardEvent): void {
        if (this.controls[ke.code] != null && !ke.metaKey) {
            this.controls[ke.code].s = true;
        }
    }
    keyUpCallback(ke: KeyboardEvent): void {
        if (this.controls[ke.code] != null) {
            this.controls[ke.code].s = false;
        }
    }
    mouseMoveCallback(me: MouseEvent): void {
        this.angleX += this.mouseSpeed * me.movementX;
        this.angleY += this.mouseSpeed * me.movementY;
    }

    boundkd: (ke: KeyboardEvent) => void;
    boundku: (ke: KeyboardEvent) => void;

    boundmm: (me: MouseEvent) => void;
    angleX = 0;
    angleY = 0;

    cattach(d: Document) {
        const canvas = d.getElementById("pixi");
        canvas.requestPointerLock();
        d.addEventListener("keydown", this.boundkd);
        d.addEventListener("keyup", this.boundku);
        d.addEventListener("mousemove", this.boundmm);

    }
    cdetach(d: Document) {
        d.exitPointerLock();
        d.removeEventListener("keydown", this.boundkd);
        d.removeEventListener("keyup", this.boundku);
        d.removeEventListener("mousemove", this.boundmm);
    }


    boundKeyListener: (ke: KeyboardEvent) => void;


    attach(document: Document) {
        this.document = document;
        this.boundKeyListener = this.keyListener.bind(this);
        this.cattach(document);
        document.addEventListener("keydown", this.boundKeyListener);

    }
    detach(): Document {
        this.document.removeEventListener("keydown", this.boundKeyListener);
        this.cdetach(this.document);
        const tmp = this.document;
        this.document = null;
        return tmp;
    }
}

const ctlr = new HackeyCamControl(three_camera);
ctlr.attach(document);
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
    ctlr.physics(delta);
    fps = fps * (1 - fpsa) + (60 / delta) * fpsa;
    fpsMeter.text = "FPS:" + fps;
}




app.ticker.add(physLoop);


function animate(time: number) {
    requestAnimationFrame(animate);
    spf = spf * (1 - spfa) + spfa * (time - oldTime) / 1000;
    fpsMeter.text = "time:" + (time / 1000).toFixed(6) + "\nfps:" + (1000 / (time - oldTime)).toFixed(2) + "\navgFps:" + (1 / spf).toFixed(2);
    three_renderer.render(three_scene, three_camera);
    oldTime = time;
}
animate(0);



