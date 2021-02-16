
import * as THREE from "three";
import { Point } from "./3dTypes";
import { Material, defaultMaterial } from "./material";
import { Marble, PHYSICS_STEP_SIZE, CALIBRATION_SCALE } from "./marble";
import { DistanceFunction } from "./distanceFunctions";



//todo:

//add a time term to colisions, make colmesh trace r+velocity distance along velocity aswell
//fix colmesh corner hitting



interface Kinematic {
    position: Point,
    velocity: Point,
    force: Point,
    angular_velocity: Point | null,
    torque: Point | null,
    material: Material | null
}


interface Colision {
    apply: (m: Kinematic) => number; //normal weight
    normal: Point;
}


function addForce(m: Marble, p: Point, f: Point) {
    m.force.addEq(f);
    m.torque.addEq(p.sub(m.position).crossEq(f));
}


class BasicColision {
    constructor(public normal: Point) { }
    apply(m: Kinematic): number {
        //delete velocity against normal
        const r = -m.velocity.dot(this.normal)
        if (r > 0) {
            m.velocity.removeComponentEq(this.normal);
        }
        return Math.max(0, r);
    }
}

class MovingColision implements Colision {
    constructor(public base: Colision, public velocity: Point = new Point()) { }
    apply(m: Kinematic): number {
        //perform colision in frame of velocity
        m.velocity.subEq(this.velocity)
        const r = this.base.apply(m);
        m.velocity.addEq(this.velocity);
        return r;
    }
    get normal(): Point {
        return this.base.normal;
    }
    set normal(p: Point) {
        this.base.normal = p;
    }
}


function get<T>(o: any, p: string, d: T): T {
    if (o[p] != null) {
        return o[p] as T;
    }
    return d;
}

class MaterialColision implements Colision {
    //does full material physics of colision

    //normal should be normalized for correct behaviour
    constructor(public normal: Point, public material: Material) { }
    apply(m: Marble): number {



        //bounce
        let bounceIntensity = Math.max(0, -m.velocity.dot(this.normal));
        let restingBounceIntensity = (-m.gravityVec.dot(this.normal) * m.marbleData.gravity * CALIBRATION_SCALE.gravity * PHYSICS_STEP_SIZE) * CALIBRATION_SCALE.restingBounceIntensity;
        if (bounceIntensity > 0) {
            //dotSlide
            const vm = m.velocity.mag();
            let dotSlide = vm == 0 ? 1 : bounceIntensity / vm;
            if (bounceIntensity < restingBounceIntensity || (dotSlide < (m.marbleData.maxDotSlide * CALIBRATION_SCALE.maxDotSlide * get(this.material, "maxDotSlide", 1)) && m.dirPushed)) {
                m.velocity.bounceNormalEq(this.normal, 0);
            } else {
                m.velocity.bounceNormalEq(this.normal, m.marbleData.bounceRestitution * get(this.material, "bounceRestitution", 1) * CALIBRATION_SCALE.bounceRestitution);
            }
        }

        //friction
        let surfaceVelocity = m.surfaceVelocity(this.normal.neg()).removeComponentEq(this.normal);
        let surfaceSpeed = surfaceVelocity.mag();
        let stopforceMag = surfaceSpeed * m.hybridMoment() / PHYSICS_STEP_SIZE;
        //kinetic friction
        let kforceMag = get(this.material, "kineticFriction", 1) * m.marbleData.kineticFriction * CALIBRATION_SCALE.kineticFriction;
        //let sforceMag = get(this.material, "staticFriction", 1) * m.marbleData.staticFriction * CALIBRATION_SCALE.staticFriction;
        //let bforceMag = (bounceIntensity > restingBounceIntensity) ? get(this.material, "bounceKineticFriction", 1) * m.marbleData.bounceKineticFriction * CALIBRATION_SCALE.bounceKineticFriction * bounceIntensity : 0;
        let netforceMag = 0;
        if (bounceIntensity > restingBounceIntensity) {
            //netforceMag = Math.min(bforceMag, stopforceMag * (1 + get(this.material, "bounceRestitution", 1) * m.marbleData.bounceRestitution));
            //bounce friction
            netforceMag = stopforceMag * get(this.material, "bounceKineticFriction", 1) * m.marbleData.bounceKineticFriction * CALIBRATION_SCALE.bounceKineticFriction;
        } else {
            //if (sforceMag > stopforceMag) {
            //static friction
            //    netforceMag = stopforceMag;
            //} else {
            //kinetic friction
            netforceMag = Math.min(kforceMag, stopforceMag * CALIBRATION_SCALE.restingTorqueIntensity);
            //}
        }
        m.addForce(surfaceVelocity.norm(-netforceMag), this.normal.neg());

        // rolling drag applied to top if is rolling
        let rollingVelocity = m.velocity.removeComponent(this.normal);
        let rollingSpeed = rollingVelocity.mag();
        if (surfaceSpeed < -1) {
            let rforceMag = Math.min(get(this.material, "staticFriction", 1) * m.marbleData.staticFriction * CALIBRATION_SCALE.staticFriction,
                CALIBRATION_SCALE.restingTorqueIntensity * rollingSpeed / PHYSICS_STEP_SIZE);
            m.addForce(m.velocity.norm(-rforceMag), this.normal);
        }
        //*
        //twist friction (forwhen spinning like a top)
        let twistVelocity = m.angular_velocity.extractComponent(this.normal);
        let twistSpeed = twistVelocity.mag();
        let ktorqueMag = Math.min(CALIBRATION_SCALE.twistKineticFrictionFactor * get(this.material, "kineticFriction", 1) * m.marbleData.kineticFriction * CALIBRATION_SCALE.kineticFriction,
            CALIBRATION_SCALE.restingTorqueIntensity * twistSpeed / PHYSICS_STEP_SIZE);
        let btorqueMag = (bounceIntensity > restingBounceIntensity) ? CALIBRATION_SCALE.twistBounceKineticFrictionFactor * get(this.material, "bounceKineticFriction", 1) * m.marbleData.bounceKineticFriction * CALIBRATION_SCALE.bounceKineticFriction * bounceIntensity : 0;
        m.torque.addEq(twistVelocity.norm(-btorqueMag - ktorqueMag));
        //static spinning friction
        if (twistSpeed < m.marbleData.maxDotSlide * CALIBRATION_SCALE.maxDotSlide * CALIBRATION_SCALE.twistMaxDotSlideFactor) {
            let storqueMag = Math.min(get(this.material, "staticFriction", 1) * m.marbleData.staticFriction * CALIBRATION_SCALE.staticFriction * CALIBRATION_SCALE.twistStaticFrictionFactor,
                CALIBRATION_SCALE.restingTorqueIntensity * twistSpeed / PHYSICS_STEP_SIZE);
            m.torque.addEq(twistVelocity.norm(-storqueMag));
        }//*/








        return bounceIntensity;

    }
}





interface WorldObject {
    colisions(m: Marble): Colision[]
}


function faces(mesh: THREE.Mesh): THREE.Face3[] {
    if ((mesh.geometry as THREE.Geometry).faces != null) {
        return (mesh.geometry as THREE.Geometry).faces
    } else {
        return new THREE.Geometry().fromBufferGeometry((mesh.geometry as THREE.BufferGeometry)).faces;
    }
}



class ColMesh implements WorldObject {
    constructor(public mesh: THREE.Mesh, public material = defaultMaterial) { }
    colisions(m: Marble): Colision[] {
        const res: Colision[] = [];
        const o = m.position.v;
        const r = new THREE.Raycaster(o, new THREE.Vector3(0, -1, 0), 0.001, m.size);
        const f = faces(this.mesh);
        for (let i in f) {
            r.set(o, f[i].normal.clone().negate());
            const ints = r.intersectObject(this.mesh);
            for (let j in ints) {
                res.push(new MaterialColision(new Point(ints[j].face.normal), this.material));
            }

        }
        return res;
    }

}



class ColDist implements WorldObject {
    constructor(public dist: DistanceFunction, public material = defaultMaterial) { }
    colisions(m: Marble): Colision[] {
        const res: Colision[] = [];
        //dynamically find /all/ colisions.
        const d = this.dist.eval(m.position);
        if (d < m.size) {
            //colision
            res.push(new MaterialColision(this.dist.gradient(m.position), this.material));
            //todo: detect multi-colisions


        }
        return res;
    }
}


class ArrayCol implements WorldObject {
    constructor(public objs: WorldObject[] = []) { }
    colisions(m: Marble): Colision[] {
        const r: Colision[] = [];
        for (var c of this.objs) {
            r.push(...c.colisions(m));
        }
        return r;
    }
}


export {
    Colision, Kinematic, WorldObject,

    BasicColision, MovingColision, MaterialColision,

    ColMesh, ColDist, ArrayCol,


}


