import * as THREE from "three";

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
    clamp(l = 0, h = 1): Point {
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
    clampEq(l = 0, h = 1): Point {
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


    removeComponent(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.sub(v.scale(m));
    }
    removeComponentEq(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.subEq(v.scale(m));
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


export {
    Point, Quaternion
}
