
import * as THREE from "three";
import { Point } from "./3dTypes";
import { Material, defaultMaterial } from "./material";
import { Marble } from "./marble";

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
    apply(m: Kinematic): number {

        let mat = m.material;
        if (mat == null) {
            mat = defaultMaterial;
        }

        //bounce
        let bounceIntensity = -m.velocity.dot(this.normal);
        if (bounceIntensity > 0) {
            m.velocity.bounceNormalEq(this.normal, get(mat, "bounceRestitution", 1) * get(this.material, "bounceRestitution", 1));

        }


        return Math.max(bounceIntensity, 0);

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








export {
    Colision, Kinematic, WorldObject,

    BasicColision, MovingColision, MaterialColision,

    ColMesh


}


