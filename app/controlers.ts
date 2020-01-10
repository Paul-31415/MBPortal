
import * as THREE from "three";
import { Quaternion, Point } from "./3dTypes";
import { Sprite } from "./sprite";
import { Marble } from "./marble";
const top_canvas = "pixi";



interface Controler {
    animate(n: number): void;
    physics(n: number): void;
    attach(d: Document): void;
    detach(): Document;
}

const peg = function(n: number): number {
    return Math.max(Math.min(Math.PI / 2, n), -Math.PI / 2);
}

class FreeCam implements Controler {
    document: Document;
    rotation: Quaternion;
    mouseCaught: boolean;
    velocity = new Point();

    constructor(public cam: THREE.PerspectiveCamera, public speed = 4, public accel = 100, public drag = 50, public mouseSpeed = Math.PI * 2 / 720) {
        this.rotation = new Quaternion();
        this.rotation.q = new THREE.Quaternion().setFromEuler(cam.rotation);
        this.boundkd = this.keyDownCallback.bind(this);
        this.boundku = this.keyUpCallback.bind(this);
        this.boundmm = this.mouseMoveCallback.bind(this);
        this.mouseCaught = false;
    }
    scaleSpeed(s: number) {
        this.speed = s;
        this.accel = s * 25;
        this.drag = this.accel / 2;
    }


    callbacks: any = {
        "Backquote": function(down: boolean) {
            if (down) {
                if (this.mouseCaught) {
                    this.mdetach(this.document);
                } else {
                    this.mattach(this.document);
                }
                this.mouseCaught = !this.mouseCaught;
            }
        }.bind(this),
        "Digit1": function(down: boolean) { if (down) { this.scaleSpeed(.0625); } }.bind(this),
        "Digit2": function(down: boolean) { if (down) { this.scaleSpeed(.125); } }.bind(this),
        "Digit3": function(down: boolean) { if (down) { this.scaleSpeed(.25); } }.bind(this),
        "Digit4": function(down: boolean) { if (down) { this.scaleSpeed(.5); } }.bind(this),
        "Digit5": function(down: boolean) { if (down) { this.scaleSpeed(1); } }.bind(this),
        "Digit6": function(down: boolean) { if (down) { this.scaleSpeed(2); } }.bind(this),
        "Digit7": function(down: boolean) { if (down) { this.scaleSpeed(4); } }.bind(this),
        "Digit8": function(down: boolean) { if (down) { this.scaleSpeed(8); } }.bind(this),


    }

    controls: any = {
        "KeyW": { s: false, r: 2, v: new Point(0, 0, -1) },
        "KeyS": { s: false, r: 2, v: new Point(0, 0, 1) },
        "KeyA": { s: false, r: 2, v: new Point(-1, 0, 0) },
        "KeyD": { s: false, r: 2, v: new Point(1, 0, 0) },
        "Space": { s: false, r: 0, v: new Point(0, 1, 0) },
        "ShiftLeft": { s: false, r: 0, v: new Point(0, -1, 0) },
        //"BracketLeft":{s:false,cb:function(){}.bind(this);},


    };


    animate(time: number) { }
    physics(delta: number) {
        const accelPt = new Point();

        for (var k in this.controls) {
            const c = this.controls[k];
            if (c.s) {
                if (c.cb != null) {
                    c.cb();
                }
                if (c.r != null) {
                    switch (c.r) {
                        case 0://global coords
                            accelPt.addEq(c.v);
                            break;
                        case 1://local coords horizontally
                            const v = this.rotation.swingTwistDecomp(0, 1, 0)[1].apply(c.v);
                            accelPt.addEq(v);
                            break;
                        case 2://full local coords
                            accelPt.addEq(this.rotation.apply(c.v));
                            break;
                    }
                }
            }
        }

        const v = this.velocity;
        //drag
        const m = v.mag();

        if (m < this.drag * delta) {
            v.scaleEq(0);
        } else {
            v.scaleEq(1 - this.drag * delta / m);
        }
        //accel
        v.addEq(accelPt.scaleEq(delta * this.accel));
        if (false) {
            //horizontal/vertical speed cap
            const vHorizMag2 = (v.x * v.x + v.z * v.z);
            if (vHorizMag2 > this.speed * this.speed) {
                const vHorizN = Math.sqrt(vHorizMag2) / this.speed;
                v.x /= vHorizN;
                v.z /= vHorizN;
            }
            if (Math.abs(v.y) > this.speed) {
                v.y = this.speed * Math.sign(v.y);
            }
        } else {
            //componential speed cap
            v.clampEq(0, accelPt.mag() * this.speed);

        }


        //apply vel
        const position = new Point(this.cam.position);


        position.addEq(v.scale(delta));
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



        this.angleY = peg(this.angleY);

        const ry = new Quaternion(-peg(this.angleY), 0, 0);
        const rx = new Quaternion(0, -this.angleX, 0);
        this.rotation = rx.multiply(ry);

        position.setXYZof(this.cam.position);

        this.cam.rotation.setFromQuaternion(this.rotation.q);

    }


    keyDownCallback(ke: KeyboardEvent): void {
        if (this.controls[ke.code] != null && !ke.metaKey) {
            this.controls[ke.code].s = true;
        }
        if (this.callbacks[ke.code] != null && !ke.metaKey) {
            this.callbacks[ke.code](true);
        }
    }
    keyUpCallback(ke: KeyboardEvent): void {
        if (this.controls[ke.code] != null) {
            this.controls[ke.code].s = false;
        }
        if (this.callbacks[ke.code] != null && !ke.metaKey) {
            this.callbacks[ke.code](false);
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
    mattach(d: Document) {
        const canvas = d.getElementById(top_canvas);
        d.addEventListener("mousemove", this.boundmm);
        canvas.requestPointerLock();
    }
    cattach(d: Document) {
        d.addEventListener("keydown", this.boundkd);
        d.addEventListener("keyup", this.boundku);
    }
    mdetach(d: Document) {
        d.exitPointerLock();
        d.removeEventListener("mousemove", this.boundmm);
    }
    cdetach(d: Document) {
        d.removeEventListener("keydown", this.boundkd);
        d.removeEventListener("keyup", this.boundku);
    }


    boundKeyListener: (ke: KeyboardEvent) => void;


    attach(document: Document) {
        this.document = document;
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



class MarbleCam implements Controler {
    lookAngle: Quaternion;
    mouseCaught: boolean;
    raycaster: THREE.Raycaster;
    constructor(public cam: THREE.PerspectiveCamera, public target: Marble, public world: THREE.Object3D = null, public mouseSpeed = Math.PI * 2 / 720, public maxCamDistance = 2, public camRoom = .1, public dir = new Point(0, 0, 1)) {
        this.lookAngle = new Quaternion();
        this.lookAngle.q = new THREE.Quaternion().setFromEuler(cam.rotation);
        this.boundkd = this.keyDownCallback.bind(this);
        this.boundku = this.keyUpCallback.bind(this);
        this.boundmm = this.mouseMoveCallback.bind(this);
        this.mouseCaught = false;
        this.raycaster = new THREE.Raycaster(this.target.position.v, this.lookAngle.apply(this.dir).v, 0.01, this.maxCamDistance);
    }
    controls: any = {
        "KeyW": { s: false, r: 1, v: new Point(0, 0, -1), t: new Point(-1, 0, 0), scale: "angularAcceleration" },
        "KeyS": { s: false, r: 1, v: new Point(0, 0, 1), t: new Point(1, 0, 0), scale: "angularAcceleration" },
        "KeyA": { s: false, r: 1, v: new Point(-1, 0, 0), t: new Point(0, 0, -1), scale: "angularAcceleration" },
        "KeyD": { s: false, r: 1, v: new Point(1, 0, 0), t: new Point(0, 0, 1), scale: "angularAcceleration" },
        "KeyE": { s: false, r: 0, v: "n", sc: 100, scale: "jumpImpulse", condition: "onGround" },
        "KeyR": { s: false, r: 0, v: "n", sc: 100, scale: "jumpImpulse", condition: "onGround", times: 1, left: 1 },
        //"KeyQ": { s: false, r: 0, v: new Point(0, -1, 0) },
    };

    step() {
        for (var k in this.controls) {
            const c = this.controls[k];
            if (c.s) {
                let cc = (c.left != 0);
                if (c.condition != null) {
                    cc = cc && ((this.target as any)[c.condition as string] != false);
                }
                if (cc) {
                    if (c.cb != null) {
                        c.cb();
                    }
                    if (c.r != null) {
                        if (c.left != null) {
                            c.left--;
                        }
                        let s = 1;
                        if (c.scale != null) {
                            s = this.target.marbleData[c.scale]
                        }
                        if (c.sc != null) {
                            s *= c.sc as number;
                        }
                        switch (c.r) {
                            case 0://global coords
                                if (c.v != null) {
                                    if (c.v == "n") {
                                        this.target.force.addEq(this.target.groundNormal.norm().scaleEq(s));
                                    } else {
                                        this.target.force.addEq(c.v.scale(s));
                                    }
                                }
                                if (c.t != null) {
                                    this.target.torque.addEq(c.t.scale(s));
                                }
                                break;
                            case 1://local coords horizontally
                                let t = this.lookAngle.swingTwistDecomp(0, 1, 0)[1];
                                if (c.v != null) {
                                    if (c.v == "n") {
                                        this.target.force.addEq(this.target.groundNormal.norm().scaleEq(s));
                                    } else {
                                        this.target.force.addEq(t.apply(c.v.scale(s)));
                                    }
                                }
                                if (c.t != null) {
                                    this.target.torque.addEq(t.apply(c.t.scale(s)));
                                }
                                break;
                            case 2://full local coords
                                t = this.lookAngle;
                                if (c.v != null) {
                                    if (c.v == "n") {
                                        this.target.force.addEq(this.target.groundNormal.norm().scaleEq(s));
                                    } else {
                                        this.target.force.addEq(t.apply(c.v.scale(s)));
                                    }
                                }
                                if (c.t != null) {
                                    this.target.torque.addEq(t.apply(c.t.scale(s)));
                                }
                                break;
                        }
                    }
                }
            }
        }
    }



    animate(time: number) {
        this.angleY = peg(this.angleY);
        const ry = new Quaternion(-this.angleY, 0, 0);
        const rx = new Quaternion(0, -this.angleX, 0);
        this.lookAngle = rx.multiply(ry);

        var len = this.maxCamDistance;
        if (this.world != null) {
            this.raycaster.far = this.maxCamDistance + this.camRoom;
            this.raycaster.set(this.target.position.v, this.lookAngle.apply(this.dir).v);
            const intersections = this.raycaster.intersectObject(this.world);
            let i = 0;
            while (intersections.length > i && intersections[i].object == this.target.object) {
                i++;
            }
            if (intersections.length > i) {
                len = intersections[i].distance - this.camRoom;
            }
        }

        this.target.position.add(this.lookAngle.apply(this.dir.scale(len))).setXYZof(this.cam.position);
        this.cam.rotation.setFromQuaternion(this.lookAngle.q);

    }

    physics(delta: number) { }

    boundkd: (ke: KeyboardEvent) => void;
    boundku: (ke: KeyboardEvent) => void;
    boundmm: (me: MouseEvent) => void;
    angleX = 0;
    angleY = 0;
    document: Document;
    attach(d: Document) {
        this.document = d;
        this.mouseCaught = true;
        const canvas = d.getElementById(top_canvas);
        d.addEventListener("mousemove", this.boundmm);
        d.addEventListener("keydown", this.boundkd);
        d.addEventListener("keyup", this.boundku);
        canvas.requestPointerLock();
        this.target.attach(this.step.bind(this));
    }
    detach(): Document {
        let d = this.document
        this.mouseCaught = false;
        d.exitPointerLock();
        d.removeEventListener("mousemove", this.boundmm);
        d.removeEventListener("keydown", this.boundkd);
        d.removeEventListener("keyup", this.boundku);
        this.target.detach();
        return d;
    }
    mouseMoveCallback(me: MouseEvent): void {
        this.angleX += this.mouseSpeed * me.movementX;
        this.angleY += this.mouseSpeed * me.movementY;
    }
    keyDownCallback(ke: KeyboardEvent): void {
        if (this.controls[ke.code] != null) {
            this.controls[ke.code].s = true;
            this.controls[ke.code].left = this.controls[ke.code].times;
        }
    }
    keyUpCallback(ke: KeyboardEvent): void {
        if (this.controls[ke.code] != null) {
            this.controls[ke.code].s = false;
        }
    }



}





export {
    Controler,
    FreeCam, MarbleCam
}
