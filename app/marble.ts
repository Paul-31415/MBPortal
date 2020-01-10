import * as THREE from "three";
import { Point, Quaternion } from "./3dTypes";
import { Sprite } from "./sprite";
import { Colision, WorldObject } from "./physics";
import { Material } from "./material";


//warning: changing this affects determinism
var PHYSICS_STEP_SIZE = 1 / 256;
//


var TIME_RATE = .5;
var DEFAULT_RADIUS = 0.39744186046511627906976744186047 / 2;
{
    let p = 32;
    let r = DEFAULT_RADIUS;

    let geometry = new THREE.SphereGeometry(r, p * 2, p);
    let loader = new THREE.TextureLoader();
    let material = new THREE.MeshStandardMaterial({ map: loader.load("resources/defaultmarble.png") });
    var defaultMarbleGraphic = new THREE.Mesh(geometry, material);
}



//http://marbleblast.proboards.com/thread/14807/default-marble-basics-reference-thread


let m: any = {};
//datablock MarbleData(DefaultMarble)
{

    m.shapeFile = "~/data/shapes/balls/ball-superball.dts";
    m.emap = true;
    m.renderFirstPerson = true;
    // maxRollVelocity = 55;
    // angularAcceleration = 120;
    m.maxRollVelocity = 15;
    m.angularAcceleration = 75;
    m.brakingAcceleration = 30;
    m.gravity = 20;
    m.staticFriction = 1.1;
    m.kineticFriction = 0.7;
    m.bounceKineticFriction = 0.2;
    m.maxDotSlide = 0.5;
    m.bounceRestitution = 0.5;
    m.jumpImpulse = 7.5;
    m.maxForceRadius = 50;

	/*
		bounce1 = Bounce1Sfx;
		bounce2 = Bounce2Sfx;
		bounce3 = Bounce3Sfx;
		bounce4 = Bounce4Sfx;

		rollHardSound = RollingHardSfx;
		slipSound = SlippingSfx;
		jumpSound = JumpSfx;

		// Emitters
		minTrailSpeed = 10;            // Trail threshold
		trailEmitter = MarbleTrailEmitter;

		minBounceSpeed = 3;           // Bounce threshold
		bounceEmitter = MarbleBounceEmitter;

		powerUpEmitter[1] = MarbleSuperJumpEmitter; // Super Jump
		powerUpEmitter[2] = MarbleSuperSpeedEmitter; // Super Speed
		// powerUpEmitter[3] = MarbleSuperBounceEmitter; // Super Bounce
		// powerUpEmitter[4] = MarbleShockAbsorberEmitter; // Shock Absorber
		// powerUpEmitter[5] = MarbleHelicopterEmitter; // Helicopter

		// Power up timouts. Timeout on the speed and jump only affect
		// the particle trail
		powerUpTime[1] = 1000;// Super Jump
		powerUpTime[2] = 1000; // Super Speed
		powerUpTime[3] = 5000; // Super Bounce
		powerUpTime[4] = 5000; // Shock Absorber
		powerUpTime[5] = 5000; // Helicopter

		// Allowable Inventory Items
		maxInv[SuperJumpItem] = 20;
		maxInv[SuperSpeedItem] = 20;
		maxInv[SuperBounceItem] = 20;
		maxInv[IndestructibleItem] = 20;
		maxInv[TimeTravelItem] = 20;
		//   maxInv[GoodiesItem] = 10;
		*/
}
type MarbleData = {
    [key: string]: any
};
const DefaultMarble_MarbleData = m as MarbleData;







class Marble implements Sprite {
    position: Point;
    velocity: Point;
    force = new Point();
    mass = 1;
    angle = new Quaternion();
    angular_velocity = new Point();
    torque = new Point();
    groundNormal = new Point();
    onGround = false;

    gravityVec = new Point(0, -1, 0);
    object: THREE.Object3D;
    size: number;

    marbleData: MarbleData = DefaultMarble_MarbleData;
    get material(): Material {
        return { bounceRestitution: this.marbleData.bounceRestitution };
    }


    constructor(pos: Point, public world: WorldObject = null, g: THREE.Object3D = null, vel = new Point()) {
        if (g == null) {
            //defaultmarble
            g = defaultMarbleGraphic;
            this.size = DEFAULT_RADIUS;
        }
        this.object = g;
        this.position = pos;
        this.velocity = vel;
    }
    get moment(): number {
        return 2 / 5 * this.mass * this.size * this.size;
    }
    StepCallback: (() => void) = function() { };
    attach(c: () => void) {
        this.StepCallback = c;
    }
    detach() {
        this.StepCallback = function() { };
    }
    step() {
        const dt = PHYSICS_STEP_SIZE;
        this.timeError -= PHYSICS_STEP_SIZE;

        this.position.addEq(this.velocity.scale(dt));
        this.velocity.addEq(this.gravityVec.scale(this.marbleData.gravity * dt)).addEq(this.force.scale(dt / this.mass));;
        this.force.scaleEq(0);

        this.angle.addVelocityEq(this.angular_velocity.scale(dt));
        this.angular_velocity.addEq(this.torque.scale(dt / this.moment));
        this.torque.scaleEq(0);

        this.onGround = false;
        this.groundNormal.xyz = [0, 0, 0];
        if (this.world != null) {
            const colisions: Colision[] = this.world.colisions(this);
            //apply colisions here
            for (let c of colisions) {
                this.groundNormal.addEq(c.normal.scale(c.apply(this)));
                this.onGround = true;
            }
        }
        this.StepCallback();
    }
    animate(t: number) {
        this.position.setXYZof(this.object.position);
        this.object.rotation.setFromQuaternion(this.angle.q);
    }
    timeError = 0;
    timeRate = TIME_RATE;
    physics(dt: number) {
        this.timeError += this.timeRate * dt;
        while (this.timeError > 0) {
            this.step();
        }
    }
}



export {
    Marble
}

