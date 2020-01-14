import * as THREE from "three";
import { DistanceFunction } from "./distanceFunctions";


//experimentally finding largest square root of zero
let rz = 1e-170;
let f = 1;
while (1 + f != 1) {
    if ((rz + f * rz) ** 2 == 0) {
        rz += rz * f;
    } else {
        f /= 2;
    }
}
const ROOT_ZERO = rz;
//smallest square root of infinity
let ri = 1e160;
f = .5;
while (1 - f != 1) {
    if ((ri - f * ri) ** 2 == Infinity) {
        ri -= ri * f;
    } else {
        f /= 2;
    }
}
const ROOT_INFINITY = ri





class Point {
    public x: number;
    public y: number;
    public z: number;

    constructor(x?: number, y?: number, z?: number);
    constructor(p: THREE.Vector3);
    constructor(a: number | THREE.Vector3 = 0, b: number = 0, c: number = 0) {
        if ((a as THREE.Vector3).z != null) {
            this.x = (a as THREE.Vector3).x;
            this.y = (a as THREE.Vector3).y;
            this.z = (a as THREE.Vector3).z;
        } else {
            this.x = a as number;
            this.y = b;
            this.z = c;
        }
    }
    copy(): Point {
        return new Point(this.x, this.y, this.z);
    }
    set(o: Point): Point {
        this.x = o.x; this.y = o.y; this.z = o.z;
        return this;
    }
    add(o: Point): Point {
        return new Point(this.x + o.x, this.y + o.y, this.z + o.z);
    }
    addEq(o: Point): Point {
        this.x += o.x; this.y += o.y; this.z += o.z;
        return this;
    }
    sub(o: Point): Point {
        return new Point(this.x - o.x, this.y - o.y, this.z - o.z);
    }
    subEq(o: Point): Point {
        this.x -= o.x; this.y -= o.y; this.z -= o.z;
        return this;
    }
    scale(s: number): Point {
        return new Point(this.x * s, this.y * s, this.z * s);
    }
    scaleEq(s: number): Point {
        this.x *= s; this.y *= s; this.z *= s;
        return this;
    }
    mul(o: Point): Point {
        return new Point(this.x * o.x, this.y * o.y, this.z * o.z);
    }
    mulEq(o: Point): Point {
        this.x *= o.x; this.y *= o.y; this.z *= o.z;
        return this;
    }
    div(o: Point): Point {
        return new Point(this.x / o.x, this.y / o.y, this.z / o.z);
    }
    divEq(o: Point): Point {
        this.x /= o.x; this.y /= o.y; this.z /= o.z;
        return this;
    }
    neg(): Point {
        return new Point(-this.x, -this.y, -this.z);
    }
    negEq(): Point {
        this.x = -this.x; this.y = -this.y; this.z = -this.z;
        return this;
    }

    dot(o: Point): number {
        return this.x * o.x + this.y * o.y + this.z * o.z;
    }
    mag2(f = 1): number {
        return (this.x * f) ** 2 + (this.y * f) ** 2 + (this.z * f) ** 2;
    }
    mag(): number {
        const m = this.mag2();
        if (m == 0) {
            return Math.sqrt(this.mag2(1 / ROOT_ZERO)) * ROOT_ZERO;
        } else {
            if (m == Infinity) {
                return Math.sqrt(this.mag2(1 / ROOT_INFINITY)) / ROOT_INFINITY;
            } else {
                return Math.sqrt(m);
            }
        }
    }
    cross(o: Point): Point {
        return new Point(this.y * o.z - this.z * o.y, this.z * o.x - this.x * o.z, this.x * o.y - this.y * o.x);
    }
    crossEq(o: Point): Point {
        const ox = this.x;
        this.x = this.y * o.z - this.z * o.y;
        const oy = this.y;
        this.y = this.z * o.x - ox * o.z;
        this.z = ox * o.y - oy * o.x;
        return this;
    }
    norm(l = 1): Point {
        const m = this.mag()
        if (m == 0) {
            return new Point(l, 0, 0);
        }
        return this.scale(l / m);
    }
    normEq(l = 1): Point {
        const m = this.mag()
        if (m == 0) {
            this.x = l;
            return this;
        }
        return this.scaleEq(l / m);
    }
    clampMag(l = 0, h = 1): Point {
        //clamps magnitude to range [l,h]
        const m = this.mag()
        if (m < l) {
            if (m == 0) {
                return new Point(l, 0, 0);
            }
            return this.scale(l / m);
        }
        if (m > h) {
            return this.scale(h / m);
        }
        return this.copy();
    }
    clampMagEq(l = 0, h = 1): Point {
        const m = this.mag()
        if (m < l) {
            if (m == 0) {
                this.x = l;
                return this;
            }
            return this.scaleEq(l / m);
        }
        if (m > h) {
            return this.scaleEq(h / m);
        }
        return this;
    }
    clamp(l: Point, h: Point): Point {
        //clamps components independently
        return this.copy().clampEq(l, h);
    }
    clampEq(l: Point, h: Point): Point {
        this.x = Math.min(h.x, Math.max(l.x, this.x));
        this.y = Math.min(h.y, Math.max(l.y, this.y));
        this.z = Math.min(h.z, Math.max(l.z, this.z));
        return this;
    }

    min(...ps: Point[]): Point {
        return this.copy().minEq(...ps);
    }
    minEq(...ps: Point[]): Point {
        const r = this;
        for (let p of ps) {
            r.x = Math.min(r.x, p.x);
            r.y = Math.min(r.y, p.y);
            r.z = Math.min(r.z, p.z);
        }
        return r;
    }
    max(...ps: Point[]): Point {
        return this.copy().maxEq(...ps);
    }
    maxEq(...ps: Point[]): Point {
        const r = this;
        for (let p of ps) {
            r.x = Math.max(r.x, p.x);
            r.y = Math.max(r.y, p.y);
            r.z = Math.max(r.z, p.z);
        }
        return r;
    }

    func(f: (n: number) => number): Point {
        return this.copy().funcEq(f);
    }
    funcEq(f: (n: number) => number): Point {
        this.x = f(this.x);
        this.y = f(this.y);
        this.z = f(this.z);
        return this;
    }

    sign(): Point {
        return this.copy().signEq();
    }
    signEq(): Point {
        return this.funcEq(Math.sign);
    }




    removeComponent(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.sub(v.scale(m));
    }
    removeComponentEq(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.subEq(v.scale(m));
    }
    extractComponent(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return v.scale(m);
    }
    extractComponentEq(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.set(v.scale(m));
    }
    bounce(n: Point, r: number): Point {
        const m = this.dot(n) / n.mag2();
        return this.sub(n.scale(m * (1 + r)));
    }
    bounceEq(n: Point, r: number): Point {
        const m = this.dot(n) / n.mag2();
        return this.subEq(n.scale(m * (1 + r)));
    }
    bounceNormal(n: Point, r: number): Point {
        const m = this.dot(n);
        return this.sub(n.scale(m * (1 + r)));
    }
    bounceNormalEq(n: Point, r: number): Point {
        const m = this.dot(n);
        return this.subEq(n.scale(m * (1 + r)));
    }


    lerp(p: Point, a: number): Point {
        return this.scale(1 - a).addEq(p.scale(a));
    }
    lerpEq(p: Point, a: number): Point {
        return this.scaleEq(1 - a).addEq(p.scale(a));
    }


    get xyz(): number[] {
        return [this.x, this.y, this.z];
    }
    set xyz(v: number[]) {
        this.x = v[0]; this.y = v[1]; this.z = v[2];
    }
    get v(): THREE.Vector3 {
        return new THREE.Vector3(this.x, this.y, this.z);
    }
    set v(v: THREE.Vector3) {
        this.x = v.x; this.y = v.y; this.z = v.z;
    }

    setXYZof(o: any) {
        o.x = this.x;
        o.y = this.y;
        o.z = this.z;
    }

    get perp(): Point {
        return Math.abs(this.z) < Math.abs(this.x) ? new Point(this.y, -this.x, 0) : new Point(0, -this.z, this.y);
    }

    get perp2(): Point {
        return this.perp.crossEq(this);
    }

    toUVW(o: Point): Point {
        //decomposes o into u,v,w components based on this.perp,this.perp2,this
        let p = this.perp;
        let p2 = p.cross(this);
        return new Point(o.dot(p) / p.mag2(), o.dot(p2) / p2.mag2(), o.dot(this) / this.mag2());
    }
    fromUVW(o: Point): Point {
        let p = this.perp;
        let p2 = p.cross(this);
        return this.scale(o.z).addEq(p.scaleEq(o.x)).addEq(p2.scaleEq(o.y));
    }

}



class Quaternion {
    public r: number;
    public i: number;
    public j: number;
    public k: number;
    constructor();
    constructor(r: number, i: number, j: number, k: number);
    constructor(aax: number, aay: number, aaz: number);
    constructor(aa: Point);
    constructor(a?: Point | number, b?: number, c?: number, d: number | null = null) {
        this.r = 1;
        this.i = 0;
        this.j = 0;
        this.k = 0;
        if (a != null) {
            if ((a as Point).x != null) {
                c = (a as Point).z;
                b = (a as Point).y;
                a = (a as Point).x;
            }
            if (d == null) {
                //axis angle
                const theta = Math.sqrt((a as number) * (a as number) + b * b + c * c);
                this.r = Math.cos(theta / 2);
                if (theta != 0) {
                    const s = Math.sin(theta / 2) / theta;
                    this.i = (a as number) * s;
                    this.j = b * s;
                    this.k = c * s;
                }
            } else {
                this.r = a as number;
                this.i = b; this.j = c; this.k = d;
            }
        }
    }


    set(o: Quaternion): Quaternion {
        this.r = o.r; this.i = o.i; this.j = o.j; this.k = o.k;
        return this;
    }
    copy(): Quaternion {
        return new Quaternion(this.r, this.i, this.j, this.k);
    }
    add(o: Quaternion): Quaternion {
        return new Quaternion(this.r + o.r, this.i + o.i, this.j + o.j, this.k + o.k);
    }
    addEq(o: Quaternion): Quaternion {
        this.r += o.r; this.i += o.i; this.j += o.j; this.k += o.k;
        return this;
    }
    sub(o: Quaternion): Quaternion {
        return new Quaternion(this.r - o.r, this.i - o.i, this.j - o.j, this.k - o.k);
    }
    subEq(o: Quaternion): Quaternion {
        this.r -= o.r; this.i -= o.i; this.j -= o.j; this.k -= o.k;
        return this;
    }
    scale(s: number): Quaternion {
        return new Quaternion(this.r * s, this.i * s, this.j * s, this.k * s);
    }
    scaleEq(s: number): Quaternion {
        this.r *= s; this.i *= s; this.j *= s; this.k *= s;
        return this;
    }


    neg(): Quaternion {
        return new Quaternion(-this.r, -this.i, -this.j, -this.k);
    }
    negEq(): Quaternion {
        this.r = -this.r; this.i = -this.i; this.j = -this.j; this.k = -this.k;
        return this;
    }

    get rijk(): number[] {
        return [this.r, this.i, this.j, this.k];
    }
    get xyzw(): number[] {
        return [this.i, this.j, this.k, this.r];
    }
    set rijk(v: number[]) {
        this.r = v[0];
        this.i = v[1];
        this.j = v[2];
        this.k = v[3];
    }
    set xyzw(v: number[]) {
        this.i = v[0];
        this.j = v[1];
        this.k = v[2];
        this.r = v[3];
    }
    get v(): Point {
        return new Point(this.i, this.j, this.k);
    }
    set v(p: Point) {
        this.i = p.x; this.j = p.y; this.k = p.z;
    }
    get q(): THREE.Quaternion {
        return new THREE.Quaternion(this.i, this.j, this.k, this.r);
    }
    set q(q: THREE.Quaternion) {
        this.i = q.x; this.j = q.y; this.k = q.z; this.r = q.w;
    }

    inverse(): Quaternion {
        const m2 = this.norm2();
        return this.conjugate().scaleEq(1 / m2);
    }
    inverseEq(): Quaternion {
        const m2 = this.norm2();
        return this.conjugateEq().scaleEq(1 / m2);
    }
    conjugate(): Quaternion {
        return new Quaternion(this.r, -this.i, -this.j, -this.k);
    }
    conjugateEq(): Quaternion {
        this.i = -this.i; this.j = -this.j; this.k = -this.k;
        return this;
    }
    norm2(): number {
        return this.r * this.r + this.i * this.i + this.j * this.j + this.k * this.k;
    }
    norm(): number {
        return Math.sqrt(this.norm2());
    }
    normalize(): Quaternion {
        const m = this.norm();
        return new Quaternion(this.r / m, this.i / m, this.j / m, this.k / m);
    }
    multiply(o: Quaternion): Quaternion {
        return new Quaternion(this.r * o.r - this.i * o.i - this.j * o.j - this.k * o.k,
            this.r * o.i + this.i * o.r + this.j * o.k - this.k * o.j,
            this.r * o.j - this.i * o.k + this.j * o.r + this.k * o.i,
            this.r * o.k + this.i * o.j - this.j * o.i + this.k * o.r);
    }
    multiplyEq(o: Quaternion): Quaternion {
        return this.set(this.multiply(o));
    }
    apply(p: Point): Point {
        const res = this.multiply(new Quaternion(0, p.x, p.y, p.z)).multiplyEq(this.conjugate());
        return res.v;
    }
    unapply(p: Point): Point {
        const res = this.conjugate().multiplyEq(new Quaternion(0, p.x, p.y, p.z)).multiplyEq(this);
        return res.v;
    }
    after(o: Quaternion): Quaternion {
        //if q = ab, rot is q p q° = ab p (ab)° = a (b p b°) a° = b.before(a) = a.after(b)
        return this.multiply(o);
    }
    before(o: Quaternion): Quaternion {
        return o.multiply(this);
    }
    swingTwistDecomp(x: number, y: number, z: number): Quaternion[] {
        //axis is assumed normed
        //vector3 ra( rotation.x, rotation.y, rotation.z ); // rotation axis
        //vector3 p = projection( ra, direction ); // return projection v1 on to v2  (parallel component)
        const pm = x * this.i + y * this.j + z * this.k;
        //twist.set( p.x, p.y, p.z, rotation.w );
        if ((pm < 0 ? -pm : pm) < .001) {
            return [this.copy(), new Quaternion()];
        }
        const twist = new Quaternion(this.r, x * pm, y * pm, z * pm).normalize();
        //swing = rotation * twist.conjugated();
        return [this.multiply(twist.conjugate()), twist];
    }

    addVelocity(v: Point): Quaternion {
        return this.before(new Quaternion(v));
    }
    addVelocityEq(v: Point): Quaternion {
        return this.set(this.before(new Quaternion(v)));
    }

}

class Color {
    constructor(public r: number = 0, public g: number = 0, public b: number = 0, public a: number = 1) { }
    get v(): THREE.Color {
        let r = new THREE.Color();
        r.r = this.r;
        r.g = this.g;
        r.b = this.b;
        return r;
    }
}


const XYZxyz_unit_vecs = [new Point(-1, 0, 0), new Point(0, -1, 0), new Point(0, 0, -1), new Point(1, 0, 0), new Point(0, 1, 0), new Point(0, 0, 1)];


class Box implements DistanceFunction {
    constructor(public low: Point, public high: Point) { }
    copy(): Box {
        return new Box(this.low.copy(), this.high.copy());
    }
    contains(p: Point): boolean {
        return p.x <= this.high.x && p.y <= this.high.y && p.z <= this.high.z && p.x >= this.low.x && p.y >= this.low.y && p.z >= this.low.z;
    }
    clamp(p: Point): Point {
        return p.clamp(this.low, this.high);
    }
    eval(p: Point, r = Infinity): number {
        if (this.contains(p)) {
            return Math.max(...p.sub(this.high).xyz, ...this.low.sub(p).xyz);
        }
        let cp = this.clamp(p).sub(p).mag2();
        if (cp < r * r) {
            return Math.sqrt(cp);
        }
        return Infinity;
    }
    gradient(p: Point): Point {
        if (this.contains(p)) {
            let id = p.sub(this.high).xyz.concat(this.low.sub(p).xyz).reduce((p, c, ci) => { if (p.v < c) { return { v: c, i: ci }; } return p; }, { v: -Infinity, i: 0 }).i;
            return XYZxyz_unit_vecs[id].copy();
        }
        return this.clamp(p).subEq(p).normEq(-1);
    }
    boundingBox = this;
    get boundingSphere(): Sphere {
        return new Sphere(this.low.lerp(this.high, .5), this.low.sub(this.high).mag() / 2);
    }
    boundingUnion(o: Box): Box {
        return this.copy().boundingUnionEq(o);
    }
    boundingUnionEq(o: Box): Box {
        this.low.minEq(o.low);
        this.high.maxEq(o.high);
        return this;
    }
}
class Sphere implements DistanceFunction {
    constructor(public pos: Point, public r: number = 1) { }
    copy(): Sphere {
        return new Sphere(this.pos.copy(), this.r);
    }
    contains(p: Point): boolean {
        return this.pos.sub(p).mag2() <= this.r * this.r;
    }
    eval(p: Point, rad: number = Infinity): number {
        const m2 = p.sub(this.pos).mag2();
        if (m2 > ((rad + this.r) ** 2)) {
            return Infinity;
        }
        return Math.sqrt(m2) - this.r;
    }
    gradient(p: Point): Point {
        return p.sub(this.pos).normEq();
    }
    get boundingBox(): Box {
        return new Box(new Point(-this.r, -this.r, -this.r).addEq(this.pos), new Point(this.r, this.r, this.r).addEq(this.pos));
    }
    boundingSphere = this;
    boundingUnion(o: Sphere): Sphere {
        return this.copy().boundingUnionEq(o);
    }
    boundingUnionEq(o: Sphere): Sphere {
        let d = this.pos.sub(o.pos);
        let dm2 = d.mag2();
        if (dm2 > (Math.abs(o.r - this.r) ** 2)) {
            //one sphere isn't fully within the other
            let dm = Math.sqrt(dm2);
            let tot = o.r + this.r + dm;
            //want tfar.lerp(ofar,.5);
            // this.pos = tfar.lerp(ofar,tfrac)
            //and o.pos = ofar.lerp(tfar,tfrac)
            //      tfar.lerp(ofar,tfrac).lerp(ofar.lerp(tfar,tfrac),x) =  (tfar*(1-tfrac)+ofar*tfrac)*(1-x)+(ofar*(1-ofrac)+tfar*ofrac)*x
            //    = tfar*((1-tfrac)*(1-x)+ofrac*x) + ofar*(tfrac*(1-x)+(1-ofrac)*x)
            //want tfrac*(1-x)+(1-ofrac)*x = .5
            //     t-tx+x-ox = .5
            //       x       = (.5-t)/(1-o-t)
            //               = .5* (1-t-t)/(1-t-o)
            //              
            let tfrac = this.r / tot;
            let ofrac = o.r / tot;
            this.pos.lerpEq(o.pos, (.5 - tfrac) / (1 - tfrac - ofrac));
            this.r = tot / 2;
            return this;
        }
        if (o.r > this.r) {
            this.r = o.r;
            this.pos.set(o.pos);
        }
        return this;
    }
}
class Plane implements DistanceFunction {
    constructor(public normal: Point, public distance: number) { }
    contains(p: Point): boolean {
        return this.eval(p) <= 0;
    }
    eval(p: Point, r = Infinity): number {
        return p.dot(this.normal) - this.distance;
    }
    gradient(p: Point): Point {
        return this.normal.copy();
    }
    bound(p: Point): Point {
        let d = this.eval(p);
        if (d <= 0) {
            return p.sub(this.normal.scale(d));
        }
        return p.copy();
    }
    get boundingBox(): Box {
        return new Box(new Point(-Infinity, -Infinity, -Infinity), new Point(Infinity, Infinity, Infinity));
    }
    get boundingSphere(): Sphere {
        return new Sphere(new Point(0, 0, 0), Infinity);
    }
    uvw(p: Point): Point {
        let r = this.normal.toUVW(p);
        r.z -= this.distance;
        return r;
    }
    fromUVW(p: Point): Point {
        return this.normal.fromUVW(new Point(p.x, p.y, p.z + this.distance));
    }
    intersectionLine(o: Plane): Point {
        //gets the intersection line with o in this's uv space
        //line tangent is o.normal x this.normal in 3-space, in uv-space is something simpler

        //line normal is just o.normal projected onto this
        let line = this.normal.toUVW(o.normal);
        //the z component is almost the line's distance term

        //ok, so normalizing a line is like this:
        // want l.xy•v=l.z  and ln.xy•v = ln.z
        // l.z /= l.xy.mag()
        // l.xy.normEq()

        //so that means that [1,1,1] and [.1,.1,.1] are the same line,
        //ie, z has an effect of z/(mag(xy));

        //so we have u,v,w, o.dist

        // intersection is at uv•p = w*o.dist-this.dist
        // 


        line.z = o.distance - this.distance * line.z;
        return line;

    }
}

function pseudoAngle2d(p: { x: number, y: number }): number {
    let r = p.y / (Math.abs(p.x) + Math.abs(p.y));
    return p.x > 0 ? r : 2 - r;
}
function pseudoAngleDifference(a: number, b: number): number {
    //4 is max
    let d = a - b;
    if (Math.abs(d) > 2) {
        return 4 - d;
    }
    return d;
}
function intersection2d(a: Point, b: Point): number {

    const uv = toUV2d(a, b);
    uv.y = b.y - a.y * uv.y;
    //point is uv.x*v=uv.y
    //so it's uv.y/uv.x
    return uv.x == 0 ? -Infinity : uv.y / uv.x;
}
function toU2d(a: Point, p: { x: number, y: number }): number {
    return (p.x * a.y - p.y * a.x) / (a.y * a.y + a.x * a.x);
}
function toUV2d(a: { x: number, y: number }, p: { x: number, y: number }): { x: number, y: number } {
    let m2 = a.x * a.x + a.y * a.y;
    return { x: (p.x * a.y - p.y * a.x) / m2, y: (a.x * p.x + a.y * p.y) / m2 };
}
function fromUV2d(a: { x: number, y: number }, uv: { x: number, y: number }): { x: number, y: number } {
    return { x: (uv.x * a.y - uv.y * a.x), y: (a.x * uv.x + a.y * uv.y) };
}


function fromU2d(a: Point, u: number): { x: number, y: number } {
    return { x: a.x * a.z + a.y * u, y: a.y * a.z - a.x * u };
}
function distSq2d(a: { x: number, y: number }, b: { x: number, y: number }): number {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function binarySearch<T>(arr: T[], v: number, f: (t: T) => number, low = 0, high: number = null): number {
    //assuming sorted in ascending order
    //returns index of first element ≥ v
    if (high == null) {
        high = arr.length;
    }
    while (high > low) {
        let m = Math.floor((high + low) / 2);
        let mi = arr[m];
        let mv = f(mi);
        if (mv > v) {
            high = m;
        } else {
            if (mv < v) {
                low = m + 1;
            } else {
                return m;
            }
        }
    }
    return low;
}



class ConvexPoly {
    //2d convex polygon, for neighbor finding for convexHull
    lines: Point[];
    average: { x: number, y: number };
    constructor(...l: Point[]) {
        this.lines = l;
        this.cull();
        this.average = { x: 0, y: 0 };
        for (let i = 0; i < this.lines.length; i++) {
            let pu = intersection2d(this.lines[i], this.lines[(i + 1) % this.lines.length]);
            let p = fromU2d(this.lines[i], pu == -Infinity ? 0 : pu);
            this.average.x += p.x;
            this.average.y += p.y;
        }
        if (this.lines.length > 0) {
            this.average.x /= this.lines.length;
            this.average.y /= this.lines.length;
        }
    }
    sort(): ConvexPoly {
        //sort by normal angle-like quantity
        //32
        //41
        this.lines.sort((a, b) => { return pseudoAngle2d(a) - pseudoAngle2d(b); });
        return this;
    }
    cull(): ConvexPoly {
        this.lines = this.lines.filter((v: Point) => { return v.x * v.x + v.y * v.y > 0; });
        this.sort();
        //spin along the lines, deleting those that don't contrubute
        //       X|
        // plane X|-> normal
        //       X|


        //    /¯\
        //   | x |
        //    \_/
        //so it's sorted like this:
        // _ ,x/ , x|, x\,¯, /x ,|x ,\x
        let i = 1;
        let activeLine = 0;

        while (activeLine < this.lines.length) {
            let intersection = Infinity;
            while (i < activeLine + this.lines.length) {
                let al = this.lines[activeLine];
                let il = this.lines[i % this.lines.length];
                let dir = al.x * il.y - al.y * il.x;
                //  al  |    il             al   il
                // want v x - > positive, [0,-1][1,0]
                // 0 * 0 - - 1
                if (dir <= 0) {
                    //next
                    break;
                } else {
                    let newDist = intersection2d(this.lines[activeLine], this.lines[i % this.lines.length]);
                    if (newDist == -Infinity) {
                        //the other line supercedes this one iff it's z is less
                        if (this.lines[activeLine].z > this.lines[i].z) {
                            this.lines.splice(activeLine, 1);
                        } else {
                            this.lines.splice(i, 1);
                        }
                    } else {
                        if (newDist < intersection) {
                            intersection = newDist;
                            //delete all lines from activeLine+1 to i-1
                            let todo = i - 1 - (activeLine + 1) - this.lines.splice(activeLine + 1, i - 1 - (activeLine + 1)).length
                            if (todo > 0) {
                                this.lines.splice(0, todo);
                                activeLine -= todo;
                            }
                            i = activeLine + 2;
                        } else {
                            i++;
                        }
                    }
                }
            }
            activeLine++;
            i = activeLine + 1;
        }
        return this;
    }
    closestPointAndLine(p: { x: number, y: number }): [{ x: number, y: number }, Point?] {
        p = { x: p.x, y: p.y };
        if (this.lines.length < 2) {
            if (this.lines.length == 1) {
                let l2: Point = null;
                let l = this.lines[0];
                let d = p.x * l.x + p.y * l.y - l.z;
                if (d < 0) {
                    p.x -= l.x * d;
                    p.y -= l.y * d;
                    l2 = l;
                }
                return [p, l2];
            }
            return [p];
        }
		/*
        //binary search through angles to find a good candidate edge
        let a = pseudoAngle2d({ x: p.x - this.average.x, y: p.y - this.average.y });
        let i = binarySearch(this.lines, a, pseudoAngle2d);
		let dir = 
		*/
        //just slide along edges
        let i = 0;
        let l = this.lines[i];
        let u = toU2d(l, p);
        let iu = intersection2d(this.lines[i], this.lines[(i + 1) % this.lines.length]);
        let dir = (u > iu) ? -1 : 1; //forward in u is +i
        while (u * dir > iu * dir) {
            i = (i + this.lines.length + dir) % this.lines.length;
            l = this.lines[i];
            u = toU2d(l, p);
            iu = intersection2d(this.lines[i], this.lines[(i + 1) % this.lines.length]);
        }
        //now if we've been sliding forward, we are on the edge nearest to p, one past the vertex nearest p
        //if we've been sliding backwards, we are one before the edge nearest, 
        i = (i + ((dir == -1) ? 1 : 0)) % this.lines.length;
        //the side of importance is -dir
        let i2 = (i + this.lines.length - dir) % this.lines.length;
        iu = intersection2d(this.lines[i], this.lines[i2]);
        l = this.lines[i];
        let v = l.x * p.x + l.y * p.y - l.z;
        if (v > 0) {//outside
            return [fromU2d(l, dir * Math.max(dir * iu, dir * toU2d(l, p))), l];
        }
        return [p];
    }
    boundingEdges(dir: { x: number, y: number }): [Point, Point] {
        //here we can binary search through angles
        let a = pseudoAngle2d(dir);
        let i = binarySearch(this.lines, a, pseudoAngle2d);
        let l1 = this.lines[i % this.lines.length];
        let l2 = this.lines[(i + this.lines.length - 1) % this.lines.length];
        let a1 = Math.abs(pseudoAngleDifference(pseudoAngle2d(l1), a));
        let a2 = Math.abs(pseudoAngleDifference(pseudoAngle2d(l2), a));
        return (a1 < a2) ? [l1, l2] : [l2, l1];
    }
    geometry(): { x: number, y: number }[] {
        let res: { x: number, y: number }[] = [];
        if (this.lines.length == 0) {
            return res;
        }
        if (this.lines.length == 1) {
            return [fromU2d(this.lines[0], -1000), fromU2d(this.lines[0], 1000)];
        }

        let pline = this.lines[this.lines.length - 1];
        for (let i = 0; i < this.lines.length; i++) {
            let lo = this.lines[(i + this.lines.length - 1) % this.lines.length];
            let start = intersection2d(this.lines[i], lo);
            if (start == -Infinity) {
                res.push(fromU2d(lo, 1000));
                res.push(fromU2d(this.lines[i], 1000));
            } else {
                res.push(fromU2d(this.lines[i], start));
            }
        }
        return res;
    }
}

class ConvexHull implements DistanceFunction {
    planes: Plane[];
    planeNeighbors: (Point & { planeIndex: number })[][];
    planePolys: ConvexPoly[] = [];
    constructor(...p: Plane[]) {
        this.planes = p;
        this.setup();
    }
    setup() {
        this.calculatePlaneNeighbors();
        this.calculateBoundingBox();
        this.calculateBoundingSphere();
    }
    calculatePlaneNeighbors(): ConvexHull {
        this.planeNeighbors = [];

        for (let i = 0; i < this.planes.length; i++) {
            let poly: (Point & { planeIndex: number })[] = [];
            for (let j = 0; j < this.planes.length; j++) {
                if (i != j) {
                    let line = this.planes[i].intersectionLine(this.planes[j]) as any;
                    line.planeIndex = j;
                    poly.push(line);
                }
            }
            this.planePolys[i] = new ConvexPoly(...poly);
            this.planeNeighbors[i] = this.planePolys[i].lines as (Point & { planeIndex: number })[];
        }
        return this;
    }
    findNearestSurfacePoint(p: Point, g: THREE.Object3D = null): [Point, boolean] {



        let pi = 0;
        let uvw = this.planes[pi].uvw(p);
        let cpl = this.planePolys[pi].closestPointAndLine(uvw);
        let gotten: { [key: number]: true } = {};

        if (g != null) {
            let points: THREE.Vector3[] = [];
            for (let p2d of this.planePolys[pi].geometry()) {
                (p2d as any).z = 0;
                points.push(this.planes[pi].fromUVW(p2d as any).v);
            }
            let geo = new THREE.BufferGeometry();
            geo.setFromPoints(points);
            g.children.push(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 4 })));
        }
        while (cpl[1] != null && gotten[pi] != true) {
            gotten[pi] = true;
            pi = (cpl[1] as (Point & { planeIndex: number })).planeIndex;
            uvw = this.planes[pi].uvw(p);
            cpl = this.planePolys[pi].closestPointAndLine(uvw);
            if (g != null) {
                let points: THREE.Vector3[] = [];
                for (let p2d of this.planePolys[pi].geometry()) {
                    (p2d as any).z = 0;
                    points.push(this.planes[pi].fromUVW(p2d as any).v);
                }
                let geo = new THREE.BufferGeometry();
                geo.setFromPoints(points);
                g.children.push(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 4 })));
            }
        }
        (cpl[0] as any).z = 0;

        return [this.planes[pi].fromUVW(cpl[0] as any), this.planes[pi].eval(p) < 0];
    }
    wireframe(o: THREE.Object3D) {
        for (let pi in this.planes) {
            let points: THREE.Vector3[] = [];
            let g = this.planePolys[pi].geometry();
            if (g.length > 0) {
                for (let p2d of g) {
                    (p2d as any).z = 0;
                    points.push(this.planes[pi].fromUVW(p2d as any).v);
                }
                points.push(this.planes[pi].fromUVW(g[0] as any).v);
            }
            let geo = new THREE.BufferGeometry();
            geo.setFromPoints(points);
            o.children.push(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 4 })));
        }
    }

    eval(p: Point, r = Infinity): number {
        let res = this.findNearestSurfacePoint(p);
        return res[0].subEq(p).mag() * (res[1] ? -1 : 1);
    }
    gradient(p: Point): Point {
        let res = this.findNearestSurfacePoint(p);
        return res[0].subEq(p).normEq(res[1] ? -1 : 1);
    }
    boundingBox: Box;
    boundingPlaneDistance(p: Point): number {
        if (this.planes.length == 0) {
            return -Infinity;
        }
        let pi = 0;
        let gotten: { [key: number]: true } = {};
        if (this.planes.length > 1) {
            while (gotten[pi] != true) {
                gotten[pi] = true;
                let uvw = this.planes[pi].uvw(p);
                if (uvw.x == 0 && uvw.y == 0) {
                    pi = (pi + 1) % this.planes.length;
                    //gotten[pi] = null;
                }
                pi = (this.planePolys[pi].boundingEdges(uvw)[0] as (Point & { planeIndex: number })).planeIndex;
            }
        }
        let uvw = this.planes[pi].uvw(p);
        if (uvw.x == 0 && uvw.y == 0) {
            return this.planes[pi].distance / p.mag();
        }
        let be = this.planePolys[pi].boundingEdges(uvw);
        let UV = fromU2d(be[0], intersection2d(be[0], be[1])) as any;
        UV.z = 0;
        this.planes[pi].fromUVW(UV);
    }
    calculateBoundingBox() {
        let ds: number[] = [];
        for (var p of XYZxyz_unit_vecs) {
            ds.push(this.boundingPlaneDistance(p));
        }
        this.boundingBox = new Box(new Point(ds[0], ds[1], ds[2]), new Point(ds[3], ds[4], ds[5]));
    }
    boundingSphere: Sphere;
    calculateBoundingSphere() {
        this.boundingSphere = new Sphere(new Point(0, 0, 0), Infinity);
    }
}



export {
    Point, Quaternion, Color, Sphere, Box, ConvexHull, Plane, ConvexPoly
}
