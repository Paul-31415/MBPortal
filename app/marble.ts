import * as THREE from "three";
import { Point, Quaternion } from "./3dTypes";
import { Sprite } from "./sprite";
import { Colision, WorldObject } from "./physics";
import { Material } from "./material";


//warning: changing this affects determinism
var PHYSICS_STEP_SIZE = 1 / 256;
//


var TIME_RATE = .5;
var DEFAULT_RADIUS = 0.39744186046511627906976744186047 / 2; //appears to be exactly 1709/4300
{
    let p = 32;
    let r = DEFAULT_RADIUS;

    let geometry = new THREE.SphereGeometry(r, p * 2, p);
    let loader = new THREE.TextureLoader();
    let material = new THREE.MeshStandardMaterial({ map: loader.load("resources/defaultmarble.png") });
    var defaultMarbleGraphic = new THREE.Mesh(geometry, material);
}


const CALIBRATION_SCALE: MarbleData = {
    maxRollVelocity: .1,
    angularAcceleration: .1,
    brakingAcceleration: .1,
    gravity: 1,
    staticFriction: 1,
    kineticFriction: 1,
    bounceKineticFriction: 1,
    maxDotSlide: 1,
    bounceRestitution: 1,
    jumpImpulse: 1,
    maxForceRadius: 1,
    airAcceleration: 1,

    restingBounceIntensity: 2,
    restingTorqueIntensity: 0.5,
    twistKineticFrictionFactor: .1,
    twistBounceKineticFrictionFactor: .1,
    twistStaticFrictionFactor: .1,
    twistMaxDotSlideFactor: 1
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
    m.maxRollVelocity = 15;        //the maximum rolling velocity you can accelerate to, when rolling faster and pressing the direction, you don't decelerate
    // I think it's something like this:
    //    if dir has a component ≥ 1 in direction of vel, no rolling drag
    m.angularAcceleration = 75;    //angular acceleration of marble, is not air acceleration, 
    m.brakingAcceleration = 30;    //order 1 or 2 drag on marble when on ground and not slipping and no direction pressed
    m.gravity = 20;                //gravity is gravity
    m.staticFriction = 1.1;        //when 0 or less, makes marble jittery and stops fast, seems to control when the transition between two drag types happens

    m.kineticFriction = 0.7;       //friction when marble is sliping (i.e. does what it says on the box)
    //min angular acceleration to keep slipping at 1 kinetic friction against a wall
    //3-fold:
    // grass:375
    //normal:250
    //   mud:
    // space:
    m.bounceKineticFriction = 0.2; //controls fraction of angular momentum imparted/absorbed when bouncing, no normal component
    //≥~.4 has same effect as 1, total conversion back and forth
    // 0 to .4 seems to control fraction of conversion
    // < 0 is negative fraction, without the limit of -.4
    //
    m.maxDotSlide = 0.5;           //seems to be the maximum vel•n/mag(vel) can be for a transition from bouncing to sliding, only when holding a direction
    //strangely, with high bounce kinetic friction, this produces sliding along the wall sideways, not up, when rolling upwards
    //         likely because its not considered a bounce then, and velocity is aligned with the wall in a way that conserves magnitude
    //  and direction along the wall
    //
    m.bounceRestitution = 0.5;     // velocity lost when bouncing, fraction of normal component of velocity, negative values of magnitude ≥ 1 lead to eventual crash
    m.jumpImpulse = 7.5;           // velocity gained when jumping
    m.maxForceRadius = 50;

    //i found this in defaultmarble.dump
    m.airAcceleration = 5;         // same units as gravity

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
    [key: string]: any,
    maxRollVelocity: number,
    angularAcceleration: number;
    brakingAcceleration: number;
    gravity: number;
    staticFriction: number;
    kineticFriction: number;
    bounceKineticFriction: number;
    maxDotSlide: number;
    bounceRestitution: number;
    jumpImpulse: number;
    maxForceRadius: number;
    airAcceleration: number;
} & Material;


type Move = {
    d: Point,
    jump: boolean,
    powerup: boolean,
    
}

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
    debugObject: THREE.Object3D;
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
        this.debugObject = new THREE.Object3D();
    }
    momentMultiplier = 1;
    get moment(): number {
        return 2 / 5 * this.mass * this.size * this.size * this.momentMultiplier;
    }
    StepCallback: (() => void) = function() { };
    attach(c: () => void) {
        this.StepCallback = c;
    }
    detach() {
        this.StepCallback = function() { };
    }

    dirPushed = false;

    //controls
    rollDesiredVelocity = new Point();
    roll(v: Point) {// v is direction to roll in
	let currentGravityDir = this.gravityVec.norm(1);
	let R = currentGravityDir.scale(-this.size);
	let rollVelocity = this.angular_velocity.cross(R);
	let currentV = rollVelocity.dot(v);
	let desiredV = this.marbleData.maxRollVelocity;//*v.mag();
	if (currentV*desiredV > desiredV*desiredV)
	    desiredV = currentV; // no drag if trying to roll forwards while going very fast forwards
	
	this.rollDesiredVelocity.addEq(v.scale(desiredV));

	
	return;
        //control of roll in direction
        if (this.onGround) {
            //todo max roll velocity
            this.torque.addEq(v.cross(this.gravityVec).scaleEq(this.marbleData.angularAcceleration * CALIBRATION_SCALE.angularAcceleration));
        } else {
            this.force.addEq(v.scale(this.marbleData.airAcceleration * CALIBRATION_SCALE.airAcceleration));
            this.torque.addEq(v.cross(this.gravityVec).scaleEq(this.marbleData.angularAcceleration * CALIBRATION_SCALE.angularAcceleration));
        }
    }
    jump(m: number) {
        if (this.onGround) {
            this.velocity.addEq(this.groundNormal.norm(Math.max(0, m * this.marbleData.jumpImpulse * CALIBRATION_SCALE.jumpImpulse / this.mass + this.velocity.dot(this.gravityVec))));
        }
    }
    computeRollForces(){
	let currentGravityDir = this.gravityVec.norm(1);
	let R = currentGravityDir.scale(-this.size);
	
	if (this.rollDesiredVelocity.mag2()){
	    let rsq = R.mag2();
	    let desiredOmega = R.cross(this.rollDesiredVelocity).unscale(rsq);
	    let aControl = desiredOmega.sub(this.angular_velocity);
	    let aScalar = aControl.mag();
	    if (aScalar > this.marbleData.angularAcceleration){
		aControl.scaleEq(this.marbleData.angularAcceleration/aScalar);
	    }
	    //desiredOmega.scaleEq(0);
	    //aControl.scaleEq(0);
	    return {result:false,aControl,desiredOmega};
	}
	return {result:true,aControl:new Point(),desiredOmega:new Point()};
    }


    computeMoveForces(m: Move,f: Quaternion){
	let aControl = new Point();
	let desiredOmega = new Point();
	let currentGravityDir = this.gravityVec.norm(1);
	let R = currentGravityDir.scale(-this.size);
	let rollVelocity = this.angular_velocity.cross(R);
	let sideDir = f.apply(new Point(1, 0, 0));
	let motionDir = f.apply(new Point(0, 0, 1));
	let upDir = f.apply(new Point(0, 1, 0));
	let currentYVelocity = rollVelocity.dot(motionDir);
	let currentXVelocity = rollVelocity.dot(sideDir);
	let mv = m.d;
	let desiredYVelocity = this.marbleData.maxRollVelocity*mv.y;
	let desiredXVelocity = this.marbleData.maxRollVelocity*mv.x;
	if (desiredYVelocity != 0 || desiredXVelocity != 0){
	    // if same dir and current V is more, don't slow down.
	    if (currentYVelocity * desiredYVelocity > desiredYVelocity * desiredYVelocity){ 
		desiredYVelocity = currentYVelocity;
	    }
	    if (currentXVelocity * desiredXVelocity > desiredXVelocity * desiredXVelocity){
		desiredXVelocity = currentXVelocity;
	    }
	    let rsq = R.mag2();
	    desiredOmega = R.cross(motionDir.scale(desiredYVelocity).addEq(sideDir.scale(desiredXVelocity))).unscale(rsq);
	    aControl = desiredOmega.sub(this.angular_velocity);
	    let aScalar = aControl.mag();
	    if (aScalar > this.marbleData.angularAcceleration){
		aControl.scaleEq(this.marbleData.angularAcceleration/aScalar);
	    }
	    return {result:false,aControl,desiredOmega};
	}
	return {result:true,aControl,desiredOmega};
    }

    //physics funciton
    //update: game physics now transcribed from https://github.com/RandomityGuy/MBHaxe/blob/master/src/Marble.hx
    getExternalForces(t:number,m:Move,dt:number){
	let A = new Point();
	//if (this.mode == Finish)
	// return this.velocity * -16;
	// grav_dir
	let a = this.gravityVec.scale(this.marbleData.gravity * CALIBRATION_SCALE.gravity)
	// if helicopter
	//  a *= 0.25
	// for obj in level.forceObjects
	//  a += obj.getForce(this.position) / this.mass
	this.onGround = false;
        this.groundNormal.xyz = [0, 0, 0];
	//contact force = 0
        if (this.world != null) {
            const colisions: Colision[] = this.world.colisions(this);
            for (let c of colisions) {
                this.groundNormal.addEq(c.normal.scale(c.apply(this)));
                this.onGround = true;
		// contact force += c.force
            }
        }
	if (this.onGround){
	    let accel = 0;
	    let dot = this.velocity.dot(this.groundNormal);
	    if (accel > dot){
		if (dot > 0){
		    accel -= dot;
		}
		A.addEq(this.groundNormal.scale(accel/dt));
	    }
	}else{
	    //if helicopter, then airAccel *= 2
	    //axes = axes
	    //A += airAccel * (side*m.d.x + forward*m.d.y)
	    

	}
	
	return A;
    }
    slipAmount = 0;
    applyContactForces(dt:number,/* m: Move,*/ isCentered: boolean, aControl: Point, desiredOmega: Point, A: Point):[Point, Point]{
	let a = new Point;
	this.slipAmount = 0;
	let gWorkGravityDir = this.gravityVec;
	//find best contact point for jump direction calculation
	//for c in contacts
	//  c.normalForce = -c.normal.dot(A);
	//argmax of normalForce
	//let bestNormalForce = this.groundNormal.dot(A);
	//let canJump = this.onGround;
	//if (canJump && m.jump){
	//    //todo later
	//}

	//add the normal forces of each surface
	//let normalForce = this.groundNormal.dot(A);
	//if (normalForce > 0 && this.groundNormal.dot(this.velocity - ground velocity) <= .0001
	//    A.addEq(this.groundNormal.scale(normalForce))
	let normalForce = this.groundNormal.dot(A);
	if (this.onGround){
	    let vAtC = this.velocity.add(this.angular_velocity.cross(this.groundNormal.scale(-this.size)));//.sub(ground velocity)
	    let vAtCMag = vAtC.mag();
	    let slipping = false;
	    let aFriction = new Point(0,0,0);
	    let AFriction = new Point(0,0,0);
	    if (vAtCMag != 0){
		slipping = true;
		let friction = 0;
		//if not start
		friction = this.marbleData.kineticFriction; // * surface friction;
		let angAMagnitude = 5 * friction * normalForce / (2 * this.size); //suspiciously akin to moment of inertia
		let AMagnitude = normalForce * friction;
		let totalDeltaV = (angAMagnitude * this.size + AMagnitude) * dt;
		if (totalDeltaV > vAtCMag){
		    let fraction = vAtCMag / totalDeltaV;
		    angAMagnitude *= fraction;
		    AMagnitude *= fraction;
		    slipping = false;
		}
		let vAtCDir = vAtC.unscale(vAtCMag);
		aFriction = this.groundNormal.scale(-1).cross(vAtCDir.scale(-1)).scale(angAMagnitude);
		AFriction = vAtCDir.scale(-AMagnitude);
		this.slipAmount = vAtCMag - totalDeltaV;
	    }
	    if (!slipping){
		let R = gWorkGravityDir.scale(-this.size);
		let aadd = R.cross(A).unscale(R.mag2());
		if (isCentered){
		    let nextOmega = this.angular_velocity.add(a.scale(dt));
		    aControl = desiredOmega.sub(nextOmega);
		    let aScalar = aControl.mag();
		    if (aScalar > this.marbleData.brakingAcceleration){
			aControl.scaleEq(this.marbleData.brakingAcceleration / aScalar);
		    }
		}
		let Aadd = aControl.cross(this.groundNormal.scale(-this.size)).scale(-1);
		let aAtCMag = aadd.cross(this.groundNormal.scale(-this.size)).add(Aadd).mag();
		let friction2 = 0.0
		//if not start
		friction2 = this.marbleData.staticFriction;// * groud friction;
		if (aAtCMag > friction2 * normalForce){
		    friction2 = 0;
		    //if not start
		    friction2 = this.marbleData.kineticFriction;// * ground friction;
		    Aadd.scaleEq(friction2 * normalForce / aAtCMag);
		}
		A = A.add(Aadd);
		a = a.add(aadd);
	    }
	    A = A.add(AFriction);
	    a = a.add(aFriction);

	    
	}
	a = a.add(aControl);
	return [A,a];
    }
    step() {
        const dt = PHYSICS_STEP_SIZE;
        this.timeError -= PHYSICS_STEP_SIZE;

	let cmf = this.computeRollForces();
	let [a,A] = this.applyContactForces(dt,cmf.result,cmf.aControl,cmf.desiredOmega,new Point(0,0,0));
	//let a = cmf.desiredOmega.sub(this.angular_velocity);
	//let A = cmf.aControl;

	//let a = new Point();
	//let A = new Point();

	this.force.addEq(A);
	this.torque.addEq(a);
	
	
        this.position.addEq(this.velocity.scale(dt));
        this.velocity.addEq(this.force.scale(dt / this.mass));
	
        this.force.set(this.gravityVec.scale(this.marbleData.gravity * CALIBRATION_SCALE.gravity));

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
        if (this.groundNormal.mag2() == 0) {
            this.onGround = false;
        }
        this.dirPushed = false;
        this.StepCallback();
    }






    debugVisible = { vectors: { velocity: { color: 0xffff00 }, angular_velocity: { color: 0xff4400 }, force: { color: 0x00ffff }, torque: { color: 0xff0000 }, rollDesiredVelocity:{color: 0x000000} }, misc: [{ f: function(m: Marble): THREE.Vector3[] { return [m.position.add(m.groundNormal.norm(m.size)).v, m.position.add(m.groundNormal.norm(m.size)).add(m.groundNormal).v]; }, v: { color: 0xffffff } }, { f: function(m: Marble): THREE.Vector3[] { return [m.position.add(m.groundNormal.norm(-m.size)).v, m.position.add(m.groundNormal.norm(-m.size)).add(m.surfaceVelocity(m.groundNormal.norm(-1))).v]; }, v: { color: 0xffff00 } }] };
    animate(t: number) {
        this.position.setXYZof(this.object.position);
        this.object.rotation.setFromQuaternion(this.angle.q);

        //debuger stuff
        this.debugObject.children.length = 0;
        for (let k in this.debugVisible.vectors) {
            let debugPath = new THREE.BufferGeometry()
            debugPath.setFromPoints([this.position.v, ((this as any)[k] as Point).add(this.position).v]);
            let lm = new THREE.LineBasicMaterial((this.debugVisible.vectors as any)[k]);
            let ob = new THREE.Line(debugPath, lm);
            this.debugObject.children.push(ob);
        }
        for (let v of this.debugVisible.misc) {
            let debugPath = new THREE.BufferGeometry()
            debugPath.setFromPoints(v.f(this));
            let lm = new THREE.LineBasicMaterial(v.v);
            let ob = new THREE.Line(debugPath, lm);
            this.debugObject.children.push(ob);
        }
    }
    timeError = 0;
    timeRate = TIME_RATE;
    physics(dt: number) {
        this.timeError += this.timeRate * dt;
        while (this.timeError > 0) {
            this.step();
        }
	this.rollDesiredVelocity.xyz = [0,0,0];
    }
    //helper functions for colisions
    surfaceVelocity(dir: Point): Point {
        //returns global surface velocity at the surface of the sphere in dir direction
        //assumes dir is normalized

        return this.velocity.add(this.angular_velocity.cross(dir.scale(this.size)));
    }
    addForce(force: Point, dir: Point) {
        //adds force and torque at the point on the surface at dir
        //assumes dir is normalized
        this.force.addEq(force);
        this.torque.subEq(force.cross(dir.scale(this.size)));
    }
    hybridMoment(r: number = this.size): number {
        return 1 / (1 / this.mass + r * r / this.moment);
    }
}



export {
    Marble, PHYSICS_STEP_SIZE, CALIBRATION_SCALE
}

