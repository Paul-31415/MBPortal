import * as THREE from "three";
import { DistanceFunction } from "./distanceFunctions";
import { Face3 } from "three";


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

class Point2D {
    public x: number;
    public y: number;
    constructor(x?: number, y?: number);
    constructor(p: THREE.Vector2);
    constructor(a: number | THREE.Vector2 = 0, b: number = 0) {
        if ((a as THREE.Vector2).y != null) {
            this.x = (a as THREE.Vector2).x;
            this.y = (a as THREE.Vector2).y;
        } else {
            this.x = a as number;
            this.y = b;
        }
    }
    copy(): Point2D {
        return new Point2D(this.x, this.y);
    }
    set(o: Point2D): Point2D {
        this.x = o.x; this.y = o.y;
        return this;
    }
    add(o: Point2D): Point2D {
        return new Point2D(this.x + o.x, this.y + o.y);
    }
    addEq(o: Point2D): Point2D {
        this.x += o.x; this.y += o.y;
        return this;
    }
    sub(o: Point2D): Point2D {
        return new Point2D(this.x - o.x, this.y - o.y);
    }
    subEq(o: Point2D): Point2D {
        this.x -= o.x; this.y -= o.y;
        return this;
    }
    scale(s: number): Point2D {
        return new Point2D(this.x * s, this.y * s);
    }
    scaleEq(s: number): Point2D {
        this.x *= s; this.y *= s;
        return this;
    }
    unscale(s: number): Point2D {
        return new Point2D(this.x / s, this.y / s);
    }
    unscaleEq(s: number): Point2D {
        this.x /= s; this.y /= s;
        return this;
    }
    mul(o: Point2D): Point2D {
        return new Point2D(this.x * o.x, this.y * o.y);
    }
    mulEq(o: Point2D): Point2D {
        this.x *= o.x; this.y *= o.y;
        return this;
    }
    div(o: Point2D): Point2D {
        return new Point2D(this.x / o.x, this.y / o.y);
    }
    divEq(o: Point2D): Point2D {
        this.x /= o.x; this.y /= o.y;
        return this;
    }
    neg(): Point2D {
        return new Point2D(-this.x, -this.y);
    }
    negEq(): Point2D {
        this.x = -this.x; this.y = -this.y;
        return this;
    }

    dot(o: Point2D): number {
        return this.x * o.x + this.y * o.y;
    }
    mag2(f = 1): number {
        return (this.x * f) ** 2 + (this.y * f) ** 2;
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
    cross(o: Point2D): number {
        return this.x * o.y - this.y * o.x;
    }
    norm(l = 1): Point2D {
        const m = this.mag()
        if (m == 0) {
            return new Point2D(l, 0);
        }
        return this.scale(l / m);
    }
    normEq(l = 1): Point2D {
        const m = this.mag()
        if (m == 0) {
            this.x = l;
            return this;
        }
        return this.scaleEq(l / m);
    }
    clampMag(l = 0, h = 1): Point2D {
        //clamps magnitude to range [l,h]
        const m = this.mag()
        if (m < l) {
            if (m == 0) {
                return new Point2D(l, 0);
            }
            return this.scale(l / m);
        }
        if (m > h) {
            return this.scale(h / m);
        }
        return this.copy();
    }
    clampMagEq(l = 0, h = 1): Point2D {
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
    clamp(l: Point2D, h: Point2D): Point2D {
        //clamps components independently
        return this.copy().clampEq(l, h);
    }
    clampEq(l: Point2D, h: Point2D): Point2D {
        this.x = Math.min(h.x, Math.max(l.x, this.x));
        this.y = Math.min(h.y, Math.max(l.y, this.y));
        return this;
    }

    min(...ps: Point2D[]): Point2D {
        return this.copy().minEq(...ps);
    }
    minEq(...ps: Point2D[]): Point2D {
        const r = this;
        for (let p of ps) {
            r.x = Math.min(r.x, p.x);
            r.y = Math.min(r.y, p.y);
        }
        return r;
    }
    max(...ps: Point2D[]): Point2D {
        return this.copy().maxEq(...ps);
    }
    maxEq(...ps: Point2D[]): Point2D {
        const r = this;
        for (let p of ps) {
            r.x = Math.max(r.x, p.x);
            r.y = Math.max(r.y, p.y);
        }
        return r;
    }

    func(f: (n: number) => number): Point2D {
        return this.copy().funcEq(f);
    }
    funcEq(f: (n: number) => number): Point2D {
        this.x = f(this.x);
        this.y = f(this.y);
        return this;
    }

    sign(): Point2D {
        return this.copy().signEq();
    }
    signEq(): Point2D {
        return this.funcEq(Math.sign);
    }




    removeComponent(v: Point2D): Point2D {
        const m = this.dot(v) / v.mag2();
        return this.sub(v.scale(m));
    }
    removeComponentEq(v: Point2D): Point2D {
        const m = this.dot(v) / v.mag2();
        return this.subEq(v.scale(m));
    }
    removeBoundedComponent(v: Point2D, l = 0, h = 1): Point2D {
        return this.copy().removeBoundedComponentEq(v, l, h);
    }
    removeBoundedComponentEq(v: Point2D, l = 0, h = 1): Point2D {
        const m = Math.min(Math.max(this.dot(v) / v.mag2(), l), h);
        return this.subEq(v.scale(m));
    }
    extractComponent(v: Point2D): Point2D {
        const m = this.dot(v) / v.mag2();
        return v.scale(m);
    }
    extractComponentEq(v: Point2D): Point2D {
        const m = this.dot(v) / v.mag2();
        return this.set(v.scale(m));
    }
    bounce(n: Point2D, r: number): Point2D {
        const m = this.dot(n) / n.mag2();
        return this.sub(n.scale(m * (1 + r)));
    }
    bounceEq(n: Point2D, r: number): Point2D {
        const m = this.dot(n) / n.mag2();
        return this.subEq(n.scale(m * (1 + r)));
    }
    bounceNormal(n: Point2D, r: number): Point2D {
        const m = this.dot(n);
        return this.sub(n.scale(m * (1 + r)));
    }
    bounceNormalEq(n: Point2D, r: number): Point2D {
        const m = this.dot(n);
        return this.subEq(n.scale(m * (1 + r)));
    }


    lerp(p: Point2D, a: number): Point2D {
        return this.scale(1 - a).addEq(p.scale(a));
    }
    lerpEq(p: Point2D, a: number): Point2D {
        return this.scaleEq(1 - a).addEq(p.scale(a));
    }


    get xy(): number[] {
        return [this.x, this.y];
    }
    set xy(v: number[]) {
        this.x = v[0]; this.y = v[1];
    }
    get v(): THREE.Vector2 {
        return new THREE.Vector2(this.x, this.y);
    }
    set v(v: THREE.Vector2) {
        this.x = v.x; this.y = v.y;
    }

    setXYof(o: any) {
        o.x = this.x;
        o.y = this.y;
    }

    get perp(): Point2D {
        return new Point2D(-this.y, this.x);
    }


    toUV(o: Point2D): Point2D {
        //decomposes o into u,v components based on this.perp,this
        let m2 = this.mag2();
        return new Point2D(o.dot(this.perp) / m2, o.dot(this) / m2);
    }
    fromUV(o: Point2D): Point2D {
        return this.perp.scale(o.x).addEq(this.scaleEq(o.y));
    }
}




class Point implements DistanceFunction {
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
    unscale(s: number): Point {
        return new Point(this.x / s, this.y / s, this.z / s);
    }
    unscaleEq(s: number): Point {
        this.x /= s; this.y /= s; this.z /= s;
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

    component(v:Point):number{
        return this.dot(v)/this.mag2();
    }
    

    removeComponent(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.sub(v.scale(m));
    }
    removeComponentEq(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.subEq(v.scale(m));
    }
    removeBoundedComponent(v: Point, l = 0, h = 1): Point {
        return this.copy().removeBoundedComponentEq(v, l, h);
    }
    removeBoundedComponentEq(v: Point, l = 0, h = 1): Point {
        const m = Math.min(Math.max(this.dot(v) / v.mag2(), l), h);
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
        return ((Math.abs(this.z) < Math.abs(this.x) ? new Point(this.y, -this.x, 0) : new Point(0, -this.z, this.y)).crossEq(this)).normEq(this.mag());
    }

    get perp2(): Point {
        return ((Math.abs(this.z) < Math.abs(this.x) ? new Point(this.y, -this.x, 0) : new Point(0, -this.z, this.y)).crossEq(this).crossEq(this)).normEq(this.mag());
    }
    
    
    toUVW(o: Point): Point {
        //decomposes o into u,v,w components based on this.perp,this.perp2,this
        let p = this.perp;
        let p2 = this.perp2;
        return new Point(o.dot(p) / p.mag2(), o.dot(p2) / p2.mag2(), o.dot(this) / this.mag2());
    }
    fromUVW(o: Point): Point {
        let p = this.perp;
        let p2 = this.perp2;
        return this.scale(o.z).addEq(p.scaleEq(o.x)).addEq(p2.scaleEq(o.y));
    }

    
    decompose(a:Point,b:Point,c:Point):Point{
        return new Point(this.dot(a) / a.mag2(),
                         this.dot(b) / b.mag2(),
                         this.dot(c) / c.mag2());
    }
    recompose(a:Point,b:Point,c:Point):Point{
        return a.scale(this.x).addEq(b.scale(this.y)).addEq(c.scale(this.z));
    }
    

    eval(p: Point, r = Infinity, t: AffineTransform = null): number {
        let pt = t == null ? this : t.apply(this);
        let npm = pt.sub(p).mag2();
        if (npm < r * r) {
            return Math.sqrt(npm);
        }
        return Infinity;
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        let pt = t == null ? this : t.apply(this);
        return p.sub(pt).normEq(1);
    }
    get boundingBox(): Box {
        return new Box(this, this);
    }
    get boundingSphere(): Sphere {
        return new Sphere(this, 0);
    }

    get xy(): Point2D {
        return new Point2D(this.x, this.y);
    }
    set xy(p: Point2D) {
        this.x = p.x; this.y = p.y;
    }

    //as Line2D (dual)
    l_toUV(p: Point2D): Point2D {
        //line is this.xy•p = this.z
        let r = this.xy.toUV(p);
        r.y -= this.z / this.xy.mag2();
        //
        return r;
    }
    l_fromUV(p: Point2D): Point2D {
        return this.xy.fromUV(new Point2D(p.x, p.y + this.z / this.xy.mag2()));
    }
    l_intersect(p: Point): number {
        let denom = this.xy.perp.dot(p.xy);
        if (denom == 0) {
            return -Infinity;
        }
        return (p.z - this.xy.dot(p.xy) * this.z) / denom;
    }
    l_unitSegmentNearest(p: Point2D, n: number = 0): Point2D {
        let uv = this.l_toUV(p);
        uv.x = Math.min(1, Math.max(0, uv.x - n)) + n;
        uv.y = 0;
        return this.l_fromUV(uv);
    }
    l_unitSegmentNearestInPlane(p: Point2D, n = 0): Point2D {
        let uv = this.l_toUV(p);
        uv.x = Math.min(1, Math.max(0, uv.x - n)) + n;
        uv.y = Math.min(0, uv.y);
        return this.l_fromUV(uv);
    }
    l_norm(n: number = 1) {
        let r = n / this.xy.mag();
        this.z *= r;
        this.xy = this.xy.scaleEq(r);
        (this as unknown as Line2D).start /= r;
        (this as unknown as Line2D).end /= r;
        return this;
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

    rotationScale(s: number): Quaternion {
        let m = Math.sqrt(this.i * this.i + this.j * this.j + this.k * this.k);
        if (m == 0) return new Quaternion();
        const theta = Math.atan2(m, this.r) * s;
        const cos = Math.cos(theta);
        const sinf = Math.sin(theta) / m;
        return new Quaternion(cos, sinf * this.i, sinf * this.j, sinf * this.k);
    }
    rotationScaleEq(s: number): Quaternion {
        let m = Math.sqrt(this.i * this.i + this.j * this.j + this.k * this.k);
        if (m == 0) return this;
        const theta = Math.atan2(m, this.r) * s;
        const cos = Math.cos(theta);
        const sinf = Math.sin(theta) / m;
        this.r = cos;
        this.i *= sinf;
        this.j *= sinf;
        this.k *= sinf;
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
class AffineTransform {
    private px: Point;
    private py: Point;
    private pz: Point;
    private pt: Point;
    inverseCache: AffineTransform;
    inverseCached: Boolean;

    uniform: boolean;
    scale: number;
    epsilon = 1e-12;

    constructor(px: Point = new Point(1, 0, 0), py: Point = new Point(0, 1, 0), pz: Point = new Point(0, 0, 1), pt: Point = new Point(0, 0, 0)) {
        this.px = px.copy();
        this.py = py.copy();
        this.pz = pz.copy();
        this.pt = pt.copy();
        this.inverseCached = false;
        let m = this.px.mag2();
        if (Math.abs(m - this.py.mag2()) / m < this.epsilon && Math.abs(m - this.pz.mag2()) / m < this.epsilon) {
            this.uniform = true;
            this.scale = this.det() / m;
        } else {
            this.uniform = false;
        }
    }
    get x(): Point {
        return this.px.copy();
    }
    get y(): Point {
        return this.py.copy();
    }
    get z(): Point {
        return this.pz.copy();
    }
    get t(): Point {
        return this.pt.copy();
    }



    apply(p: Point, w: number = 1): Point {
        //w is the 4th coord in homog coords
        return this.px.scale(p.x).addEq(this.py.scale(p.y)).addEq(this.pz.scale(p.z)).addEq(this.pt.scale(w));
    }
    applyNormal(p: Point): Point {
        let i = this.inverse();
        return new Point(i.px.x * p.x + i.py.x * p.y + i.pz.x * p.z,
            i.px.y * p.x + i.py.y * p.y + i.pz.y * p.z,
            i.px.z * p.x + i.py.z * p.y + i.pz.z * p.z);
    }
    det(): number {
        return this.py.y * (this.px.x * this.pz.z - this.px.z * this.pz.x) +
            this.pz.y * (this.py.x * this.px.z - this.py.z * this.px.x) +
            this.px.y * (this.pz.x * this.py.z - this.pz.z * this.py.x);
    }
    inverse(): AffineTransform {
        if (this.inverseCached) {
            return this.inverseCache;
        } else {
            this.inverseCached = true;
            const s0: number = this.px.x * this.py.y - this.px.y * this.py.x;
            const s1: number = this.px.x * this.pz.y - this.px.y * this.pz.x;
            const s2: number = this.px.x * this.pt.y - this.px.y * this.pt.x;
            const s3: number = this.py.x * this.pz.y - this.py.y * this.pz.x;
            const s4: number = this.py.x * this.pt.y - this.py.y * this.pt.x;
            const s5: number = this.pz.x * this.pt.y - this.pz.y * this.pt.x;

            const det = (s0 * this.pz.z - s1 * this.py.z + s3 * this.px.z);
            const invdet: number = 1 / det;

            this.inverseCache = new AffineTransform(
                new Point((this.py.y * this.pz.z - this.pz.y * this.py.z) * invdet,
                    (-this.px.y * this.pz.z + this.pz.y * this.px.z) * invdet,
                    (this.px.y * this.py.z - this.py.y * this.px.z) * invdet),
                new Point((-this.py.x * this.pz.z + this.pz.x * this.py.z) * invdet,
                    (this.px.x * this.pz.z - this.pz.x * this.px.z) * invdet,
                    (-this.px.x * this.py.z + this.py.x * this.px.z) * invdet),
                new Point(s3 * invdet,
                    -s1 * invdet,
                    s0 * invdet),
                new Point((-this.py.z * s5 + this.pz.z * s4 - this.pt.z * s3) * invdet,
                    (this.px.z * s5 - this.pz.z * s2 + this.pt.z * s1) * invdet,
                    (-this.px.z * s4 + this.py.z * s2 - this.pt.z * s0) * invdet));

            this.inverseCache.inverseCache = this;
            this.inverseCache.inverseCached = true;
            return this.inverseCache;
        }
    }
    get v(): THREE.Matrix4 {
        let res = new THREE.Matrix4();
        res.set(this.px.x, this.py.x, this.pz.x, this.pt.x,
            this.px.y, this.py.y, this.pz.y, this.pt.y,
            this.px.z, this.py.z, this.pz.z, this.pt.z,
            0, 0, 0, 1);
        return res;
    }
    before(t: AffineTransform): AffineTransform {
        return new AffineTransform(t.apply(this.px, 0), t.apply(this.py, 0), t.apply(this.pz, 0), t.apply(this.pt, 1));
    }
    after(t: AffineTransform): AffineTransform {
        return t.before(this);
    }


}
const IDENTITY_TRANSFORM = new AffineTransform();

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
    contains(p: Point, t: AffineTransform = null): boolean {
        if (t == null) {
            return p.x <= this.high.x && p.y <= this.high.y && p.z <= this.high.z && p.x >= this.low.x && p.y >= this.low.y && p.z >= this.low.z;
        } else {
            return this.contains(t.inverse().apply(p));
        }
    }
    clamp(p: Point, t: AffineTransform = null): Point {
        if (t == null) {
            return p.clamp(this.low, this.high);
        } else {
            let lx = new Plane(new Point(1, 0, 0), this.low.x).transform(t);
            let ly = new Plane(new Point(0, 1, 0), this.low.y).transform(t);
            let lz = new Plane(new Point(0, 0, 1), this.low.z).transform(t);
            let hx = new Plane(new Point(-1, 0, 0), this.high.x).transform(t);
            let hy = new Plane(new Point(0, -1, 0), this.high.y).transform(t);
            let hz = new Plane(new Point(0, 0, -1), this.high.z).transform(t);
            let y = ly.normal.removeComponent(lx.normal);
            let z = lx.normal.cross(ly.normal);//perp with both
            return hz.bound(lz.bound(hy.bound(ly.bound(hx.bound(lx.bound(p)), y), y), z), z);
        }
    }

    eval(p: Point, r = Infinity, t: AffineTransform = null): number {
        if (this.contains(p)) {
            if (t == null) {
                return Math.max(...p.sub(this.high).xyz, ...this.low.sub(p).xyz);
            } else {
                let lx = new Plane(new Point(1, 0, 0), this.low.x);
                let ly = new Plane(new Point(0, 1, 0), this.low.y);
                let lz = new Plane(new Point(0, 0, 1), this.low.z);
                let hx = new Plane(new Point(-1, 0, 0), this.high.x);
                let hy = new Plane(new Point(0, -1, 0), this.high.y);
                let hz = new Plane(new Point(0, 0, -1), this.high.z);
                return Math.max(lx.eval(p, Infinity, t), ly.eval(p, Infinity, t), lz.eval(p, Infinity, t),
                    hx.eval(p, Infinity, t), hy.eval(p, Infinity, t), hz.eval(p, Infinity, t));
            }
        }
        let cp = this.clamp(p, t);
        return cp.eval(p, r);
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        if (this.contains(p)) {
            if (t == null) {
                let id = p.sub(this.high).xyz.concat(this.low.sub(p).xyz).reduce((p, c, ci) => { if (p.v < c) { return { v: c, i: ci }; } return p; }, { v: -Infinity, i: 0 }).i;
                return XYZxyz_unit_vecs[id].copy();
            } else {
                let lx = new Plane(new Point(1, 0, 0), this.low.x).transform(t);
                let ly = new Plane(new Point(0, 1, 0), this.low.y).transform(t);
                let lz = new Plane(new Point(0, 0, 1), this.low.z).transform(t);
                let hx = new Plane(new Point(-1, 0, 0), this.high.x).transform(t);
                let hy = new Plane(new Point(0, -1, 0), this.high.y).transform(t);
                let hz = new Plane(new Point(0, 0, -1), this.high.z).transform(t);
                let id = [lx.eval(p), ly.eval(p), lz.eval(p), hx.eval(p), hy.eval(p), hz.eval(p)].reduce((p, c, ci) => { if (p.v < c) { return { v: c, i: ci }; } return p; }, { v: -Infinity, i: 0 }).i;
                return [lx, ly, lz, hx, hy, hz][id].gradient(p);
            }
        }
        return this.clamp(p, t).gradient(p);
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
    corner(n = 0): Point {
        return new Point(((n & 1) == 0) ? this.low.x : this.high.x, ((n & 2) == 0) ? this.low.y : this.high.y, ((n & 4) == 0) ? this.low.z : this.high.z);

    }
    transform(t: AffineTransform) {
        let candidates = [t.apply(this.corner(1)), t.apply(this.corner(2)), t.apply(this.corner(3)),
        t.apply(this.corner(4)), t.apply(this.corner(5)), t.apply(this.corner(6)), t.apply(this.corner(7))];
        let c1 = t.apply(this.low);

        let min = c1.min(...candidates).addEq(t.t);
        let max = c1.max(...candidates).addEq(t.t);
        return new Box(min, max);
    }
}
class Sphere implements DistanceFunction {
    constructor(public pos: Point, public r: number = 1) { }
    copy(): Sphere {
        return new Sphere(this.pos.copy(), this.r);
    }
    contains(p: Point, t: AffineTransform = null): boolean {
        if (t == null) {
            return this.pos.sub(p).mag2() <= this.r * this.r;
        } else {
            return this.pos.sub(t.inverse().apply(p)).mag2() <= this.r * this.r;
        }
    }
    closestPoint(p: Point, t: AffineTransform = null, steps = 200, epsilon = 1e-6, speed = .5): Point {
        if (t == null) {
            return this.pos.add(p.sub(this.pos).normEq(this.r));
        } else {
            if (t.uniform) {
                return t.apply(this.pos).addEq(p.sub(t.apply(this.pos)).normEq(this.r * t.scale));
            } else {
                //gradient descent 2nd attempt
                let inv = t.inverse();
                let utguess = this.closestPoint(inv.apply(p));
                for (let i = 0; i < steps; i++) {
                    let guess = t.apply(utguess);
                    let dist = guess.sub(p).mag2();

                    let utn = utguess.sub(this.pos);
                    let utt1 = utn.perp;
                    let utt2 = utn.perp2;
                    let t1 = t.apply(utt1).normEq();
                    let t2 = t.apply(utt2).normEq();
                    let g1 = (t1.scale(epsilon).addEq(guess).subEq(p).mag2() - dist) / epsilon;
                    let g2 = (t2.scale(epsilon).addEq(guess).subEq(p).mag2() - dist) / epsilon;
                    utguess.addEq(t.apply(t1.scale(g1 * speed).addEq(t2.scale(g2 * speed)))).subEq(this.pos).normEq(this.r).addEq(this.pos);
                }

                return t.apply(utguess);



                //https://www.geometrictools.com/Documentation/DistancePointEllipseEllipsoid.pdf





                //gradient descent approximation
				/*
                //initial guess:
                let guess = this.closestPoint(t.inverse().apply(p));
                let e = epsilon;
                for (let i = 0; i < steps; i++) {

                    let qu = new Quaternion(guess.perp.normEq(e));
                    let qv = new Quaternion(guess.perp2.normEq(e));
                    let val = t.apply(guess).sub(p).mag2();
                    let u = qu.apply(guess);
                    let v = qv.apply(guess);
                    let partialU = (t.apply(u).sub(p).mag2() - val) / e;
                    let partialV = (t.apply(v).sub(p).mag2() - val) / e;
                    let rot = qu.scale(partialU).addEq(qv.scale(partialV)).normalize().rotationScaleEq(1 / e);
                    guess = rot.apply(guess);
                }

                return guess;
				*/
            }
        }
    }
    eval(p: Point, rad: number = Infinity, t: AffineTransform = null): number {
        if (t == null) {
            return this.pos.eval(p, rad + this.r) - this.r;
        } else {
            return (this.contains(p, t) ? -1 : 1) * this.closestPoint(p, t).sub(p).mag();
        }
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        if (t == null) {
            return this.pos.gradient(p);
        } else {
            return this.closestPoint(p, t).sub(p).normEq(-1);
        }
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
    eval(p: Point, r = Infinity, t: AffineTransform = null): number {
        if (t == null) {
            return (p.dot(this.normal) - this.distance) / this.normal.mag();
        } else {
            let n = t.apply(this.normal, 0);
            //new normal: t.apply(this.normal, 0)
            //new distance: t.apply(this.normal.scale(this.distance),0).mag()+t.t.dot(newNormal)
            let m = n.mag();
            return (p.dot(n) - m * this.distance - t.t.dot(n)) / m;
        }
    }
    transform(t: AffineTransform) {
        let n = t.apply(this.normal, 0);
        let m = n.mag();
        return new Plane(n, m * this.distance + t.t.dot(n));
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        if (t == null) {
            return this.normal.norm();
        }
        return t.apply(this.normal).normEq();
    }
    bound(p: Point, v: Point = null): Point {
        if (v == null) {
            v = this.normal;
        }
        let d = (p.dot(this.normal) - this.distance);
        d /= this.normal.dot(v);
        if (d <= 0) {
            return p.sub(v.scale(d));
            //n•(p-v*(p•n-d)/(n•v))-d=
            // n•p-n•v*(p•n-d)/(n•v)-d =
            // n•p-p•n+d-d = 0 √
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
        r.z -= this.distance / this.normal.mag2();
        return r;
    }
    fromUVW(p: Point): Point {
        return this.normal.fromUVW(new Point(p.x, p.y, p.z + this.distance / this.normal.mag2()));
    }
    intersectionLine(o: Plane): Line2D {
        //gets the intersection line with o in this's uv space
        //line tangent is o.normal x this.normal in 3-space, in uv-space is something simpler

        //this plane is all v st v•n=d
        // other plane:          v•m=e

        // so, we want an l,o st v°•l=o
        // where v° = v•n.perp * x + v•n.perp2 * y
        // solving for l and o:
        // 1] v•n=d
        // 2] v•m=e
        // 3] v•n.perp*l.x + v•n.perp2*l.y = o
        // ---
        //
        // this seems to be working


        let line = this.normal.toUVW(o.normal);

        line.z = o.distance - this.distance * line.z;


        return line as Line2D;

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
class Line implements DistanceFunction {
    boundingBox: Box = new Box(new Point(Infinity, Infinity, Infinity), new Point(-Infinity, -Infinity, -Infinity));
    boundingSphere: Sphere = new Sphere(new Point(0, 0, 0), -Infinity);
    constructor(public a: Point, public b: Point) { }
    getNearestDPoint(p: Point, t: AffineTransform = null): Point {
        if (t == null) {
            return p.sub(this.a).removeComponentEq(this.b.sub(this.a));
        } else {
            return p.sub(t.apply(this.a)).removeComponentEq(t.apply(this.b.sub(this.a)));
        }
    }
    eval(p: Point, r = Infinity, t: AffineTransform = null): number {
        let npm = this.getNearestDPoint(p, t).mag2();
        if (npm < r * r) {
            return Math.sqrt(npm);
        }
        return Infinity;
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        return this.getNearestDPoint(p, t).normEq(1);
    }
}

class LineSegment extends Line {
    constructor(a: Point, b: Point) { super(a, b); }
    getNearestDPoint(p: Point, t: AffineTransform = null): Point {
        if (t == null) {
            return p.sub(this.a).removeBoundedComponentEq(this.b.sub(this.a));
        } else {
            return p.sub(t.apply(this.a)).removeBoundedComponentEq(t.apply(this.b.sub(this.a)));
        }
    }
    get boundingBox(): Box {
        return new Box(this.a.min(this.b), this.a.max(this.b));
    }
    get boundingSphere(): Sphere {
        return new Sphere(this.a.lerp(this.b, .5), this.a.sub(this.b).mag() / 2);
    }
}


class RingBuffer<T> {
    indexShift = 0;
    items: T[]
    constructor(...items: T[]) {
        this.items = items;
    }
    get length() { return this.items.length; }
    index(i: number): number { return (((i + this.indexShift) % this.length) + this.length) % this.length; }
    get(i: number) {
        return this.items[this.index(i)];
    }
    set(i: number, v: T) {
        this.items[this.index(i)] = v;
    }
    splice(i: number, n: number, ...v: T[]) {
        let r = this.items.splice(this.index(i), n, ...v);
        if (r.length < n) {
            r.push(...this.items.splice(0, n - r.length));
        }
        return r;
    }
    push(...v: T[]) {
        return this.items.push(...v);
    }
    pop() {
        return this.items.pop();
    }
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
    searchUp(predicate: (value: T) => Boolean, startI = 0, endI: number = null): [T, number] | null {
        if (endI == null) {
            endI = this.length;
        }
        for (var i = 0; i < endI; i++) {
            if (predicate(this.get(i + startI))) return [this.get(i + startI), i + startI];
        }
    }
    searchDown(predicate: (value: T) => Boolean, startI = 0, endI: number = null): [T, number] | null {
        if (endI == null) {
            endI = this.length;
        }
        for (var i = 0; i < endI; i++) {
            if (predicate(this.get(startI - i))) return [this.get(startI - i), startI - i];
        }
    }


}


type Line2D = Point & { start: number, end: number, c: Point2D, cc: Point2D, visiblePoints?: Point2D[], farthestVisiblePoint?: Point2D, visible?: Set<Point2D> };
class ConvexPoly implements DistanceFunction {

    lines: RingBuffer<Line2D> = new RingBuffer();//sorted counterclockwize
    points: RingBuffer<Point2D> = new RingBuffer();
    constructor(public plane: Plane, public defaultEmpty = true, public epsilon = 0) { }
    addPoints(...p: Point2D[]): ConvexPoly {
        if (p.length == 0) {
            return this;
        }
        if (this.points.length == 0) {
            if (this.defaultEmpty) {
                this.points.push(p.pop());
                if (p.length == 0) {
                    return this;
                }
            } else {
                return this;
            }
        }
        if (this.points.length == 1) {
            //not co-point
            let cp = p.pop();
            while (cp.sub(this.points.get(0)).mag2() < this.epsilon * this.epsilon) {
                if (p.length == 0) {
                    return this;
                }
                cp = p.pop();
            }
            this.points.push(cp);
            //make the 2 lines
            let n = this.points.get(0).sub(this.points.get(1)).perp;
            let l1 = new Point(n.x, n.y, 0) as Line2D;
            l1.z = l1.l_toUV(this.points.get(0)).y * l1.xy.mag2();
            let l2 = new Point(-n.x, -n.y, -l1.z) as Line2D;
            l1.cc = this.points.get(1);
            l1.c = this.points.get(0);
            l2.cc = l1.c;
            l2.c = l1.cc;
            l1.start = l1.l_toUV(l1.c).x;
            l2.start = l2.l_toUV(l2.c).x;
            l1.end = l1.start + 1;
            l2.end = l2.start + 1;

            this.lines.splice(0, 0, l1, l2);
        }
        //classify the remaining points
        for (let l of this.lines) {
            l.visiblePoints = [];
            l.farthestVisiblePoint = null;
            let maxv = 0;
            for (let pt of p) {
                let v = l.l_toUV(pt).y;
                if (v > 0) {
                    l.visiblePoints.push(pt);

                }
                if (v > maxv) {
                    maxv = v;
                    l.farthestVisiblePoint = pt;
                }
            }
            l.visible = new Set(l.visiblePoints);
        }
        for (let i = 0; i < this.lines.length; i++) {
            let loi = this.lines.get(i);
            if (loi.farthestVisiblePoint != null) {

                // compute horisons
                let pt = loi.farthestVisiblePoint;
                let pts = new Set<Point2D>();
                let f = (o: Line2D) => { if (o.visible.has(pt)) { pts = new Set([...pts, ...o.visible]); return false; } return true; };
                let dn = this.lines.searchDown(f, i);
                let up = this.lines.searchUp(f, i);

                let n1 = dn[0].cc.sub(pt).perp;
                let n2 = pt.sub(up[0].c).perp;

                let l1 = new Point(n1.x, n1.y, 0) as Line2D;
                let l2 = new Point(n2.x, n2.y, 0) as Line2D;
                l1.z = l1.l_toUV(pt).y * l1.xy.mag2();
                l2.z = l2.l_toUV(pt).y * l2.xy.mag2();



                l1.c = dn[0].cc;
                l1.cc = pt;
                l2.c = pt;
                l2.cc = up[0].c;
                l1.start = l1.l_toUV(l1.c).x;
                l2.start = l2.l_toUV(l2.c).x;

                l1.end = l1.start + 1;
                l2.end = l2.start + 1;

                //l1.end = l1.l_toUV(l1.cc).x;
                //l2.end = l2.l_toUV(l2.cc).x;
                //put pts into place
                let maxv1 = 0;
                let maxv2 = 0;
                l1.visiblePoints = [];
                l2.visiblePoints = [];
                for (let ptc of pts) {
                    let v1 = l1.l_toUV(ptc).y;
                    if (v1 > 0) {
                        l1.visiblePoints.push(ptc);
                    }
                    if (v1 > maxv1) {
                        maxv1 = v1;
                        l1.farthestVisiblePoint = ptc;
                    }
                    let v2 = l2.l_toUV(ptc).y;
                    if (v2 > 0) {
                        l2.visiblePoints.push(ptc);
                    }
                    if (v2 > maxv2) {
                        maxv2 = v2;
                        l2.farthestVisiblePoint = ptc;
                    }
                }
                l1.visible = new Set(l1.visiblePoints);
                l2.visible = new Set(l2.visiblePoints);
                this.lines.splice(dn[1] + 1, up[1] - (dn[1] + 1), l1, l2);

                i = 0;//restart iteration
            }

        }
        //get points
        this.points.items = [];
        for (let i = 0; i < this.lines.length; i++) {
            this.points.items[i] = this.lines.items[i].cc;
        }
        return this;
    }
    setFromLines(...l: Point[]) {
        this.lines.items = [];
        this.defaultEmpty = false;
        return this.addLines(...l);
    }
    addLines(...p: Point[]) {
        let l = p as Line2D[];
        if (this.lines.length == 0 && this.defaultEmpty) {
            return this;
        }
        l.push(...this.lines);
        //a-b is ascending
        l.sort((a: Line2D, b: Line2D) => { return pseudoAngle2d(a.xy) - pseudoAngle2d(b.xy); });


        //now go through and delete any line that isn't on the edge, meanwhile, calc start, end
        let res: Line2D[] = [];
        for (let i = 0; i < l.length; i++) {
            this.defaultEmpty = true;
            let ln = l[i];
            ln.start = -Infinity;
            ln.end = Infinity;
            ln.c = null; //fromU(start)
            ln.cc = null;//fromU(end)
            res.push(ln);
            for (let j = 0; j < l.length; j++) {
                if (j != i) {
                    let l2 = l[j];
                    let dir = ln.xy.cross(l2.xy);
                    let int = ln.l_intersect(l2);
                    if (dir < 0) {//l2 is "behind" ln
                        if (int > ln.start) {
                            ln.start = int;
                        }
                    } else {
                        if (dir > 0) {
                            if (int < ln.end) {
                                ln.end = int;
                            }
                        } else {
                            //check if l2 is more restrictive than ln
                            if (l2.l_toUV(ln.l_fromUV(new Point2D(0, 0))).y >= 0) {
                                //remove line ln
                                res.pop();
                                break;
                            }
                        }
                    }
                    if (ln.start >= ln.end) {
                        //remove line ln
                        res.pop();
                        break;
                    }
                }
            }
        }
        //check for empty gon !todo




        //set answer
        this.lines.items = res;
        this.points.items = [];
        //calc points
        for (let i = 0; i < this.lines.length; i++) {
            //l1.c, l1.cc==l2.c, l2.cc
            //l1.cc = pt;
            //l2.c = pt;
            let ln = this.lines.get(i);
            let pln = this.lines.get(i - 1);
            if (ln.start != Infinity) {
                ln.c = ln.l_fromUV(new Point2D(ln.start, 0));
            }
            if (ln.c != null) {
                pln.cc = ln.c;
                this.points.push(ln.c);
            }
        }
        return this;
    }



    corner(i: number): Point {
        let p = this.points.get(i);
        return this.plane.fromUVW(new Point(p.x, p.y, 0));
    }
    get boundingBox() {
        let minPT = new Point(Infinity, Infinity, Infinity);
        let maxPT = new Point(-Infinity, -Infinity, -Infinity);
        if (this.lines.length == 0) {
            if (this.defaultEmpty) return new Box(minPT, maxPT);
            return this.plane.boundingBox;
        }
        if (this.lines.length != this.points.length) {
            //unbounded shape
            //this is not optimal but i'm lazy because these boxes dont seem to be being used much now
            return this.plane.boundingBox;
        }
        for (let i = 0; i < this.points.length; i++) {
            let p = this.corner(i);
            minPT.minEq(p);
            maxPT.maxEq(p);
        }
        return new Box(minPT, maxPT);
    }
    get boundingSphere() {
        //bad approx, whatever
        return this.boundingBox.boundingSphere;
    }
    closestEdge(p3: Point): Line2D | null {
        let p = this.plane.uvw(p3).xy;
        let minDist = Infinity;
        let minDistL: Line2D = null;
        for (let i = 0; i < this.lines.length; i++) {
            let ln = this.lines.get(i);
            let uv = ln.l_toUV(p)
            if (uv.y >= 0) {
                uv.x = Math.max(Math.min(uv.x, ln.end), ln.start);
                uv.y = ln.z / ln.xy.mag2();
                let r = ln.xy.fromUV(uv)
                let l = r.sub(p).mag2();
                if (l < minDist) {
                    minDist = l;
                    minDistL = ln;
                }
            }
        }
        return minDistL;
    }
    contains2D(p: Point2D): boolean {
        for (let i = 0; i < this.lines.length; i++) {
            let ln = this.lines.get(i);
            let uv = ln.l_toUV(p)
            if (uv.y >= 0) {
                return false;
            }
        }
        return (this.lines.length == 0) ? !this.defaultEmpty : true;
    }
    closestPoint2D(p: Point2D): Point2D {
        let minDist = Infinity;
        let minDistR: Point2D = p;
        for (let i = 0; i < this.lines.length; i++) {
            let ln = this.lines.get(i);
            let uv = ln.l_toUV(p)
            if (uv.y >= 0) {
                uv.x = Math.max(Math.min(uv.x, ln.end), ln.start);
                uv.y = ln.z / ln.xy.mag2();
                let r = ln.xy.fromUV(uv)
                let l = r.sub(p).mag2();
                if (l < minDist) {
                    minDist = l;
                    minDistR = r;
                }
            }
        }
        return minDistR;
    }
    closestPoint(p: Point): Point {
        if (this.lines.length == 0) {
            if (this.points.length == 0) {
                if (this.defaultEmpty) {
                    return new Point(Infinity, Infinity, Infinity);
                } else {
                    let p2 = this.plane.uvw(p);
                    p2.z = 0;
                    return this.plane.fromUVW(p2);
                }
            }
            return this.corner(0);
        }
        let p2 = this.closestPoint2D(this.plane.uvw(p).xy);
        return this.plane.fromUVW(new Point(p2.x, p2.y, 0));
    }
    eval(p: Point, r = Infinity, t: AffineTransform = null): number {
        if (t != null) return this.transform(t).eval(p, r);
        if (this.lines.length == 0) {
            if (this.points.length == 0) {
                if (this.defaultEmpty) {
                    return Infinity;
                }
            }
        }
        let d = this.closestPoint(p).subEq(p).mag2();
        if (d < r * r) {
            return Math.sqrt(d);
        }
        return Infinity;
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        if (t != null) return this.transform(t).gradient(p);
        if (this.lines.length == 0) {
            if (this.points.length == 0) {
                this.plane.normal.norm();
            }
        }
        return this.closestPoint(p).subEq(p).normEq(-1);
    }
    transform(t: AffineTransform) {
        let res = new ConvexPoly(this.plane.transform(t), this.defaultEmpty, this.epsilon);

        let u = res.plane.uvw(this.plane.fromUVW(t.x)).xy;
        let v = res.plane.uvw(this.plane.fromUVW(t.y)).xy;

        for (let p of this.points) {
            res.points.push(u.scale(p.x).addEq(v.scale(p.y)));
        }
        for (let l of this.lines) {
            let ln = new Point(l.x, l.y, l.z) as Line2D;

            ln.start = l.start;
            ln.end = l.end;

            //todo

        }

        return res;
    }
    pointList(): Point[] {
        let pts: Point[] = [];
        for (let i = 0; i < this.points.length; i++) {
            pts[i] = this.corner(-i);
        }
        return pts;
    }
    geometry(): THREE.BufferGeometry {
        let g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(trifan(this.pointList())), 3));
        return g;
    }
    containsInPlane(p: Point) {
        if (this.plane.contains(p)) {
            if (this.contains2D(this.plane.uvw(p).xy)) {
                return true;
            }
        }
        return false;
    }
}
function trifan(pts: Point[]): number[] {
    let res: number[] = [];
    for (let i = 2; i < pts.length; i++) {
        res.push(...pts[0].xyz, ...pts[i - 1].xyz, ...pts[i].xyz);
    }
    return res;
}


class ConvexHull implements DistanceFunction {
    boundingBox: Box = new Box(new Point(Infinity, Infinity, Infinity), new Point(-Infinity, -Infinity, -Infinity));
    boundingSphere: Sphere = new Sphere(new Point(0, 0, 0), -Infinity);

    //points: Point[] = [];
    faces: ConvexPoly[] = [];
    constructor(public defaultEmpty = true, public epsilon = 0) { }
    addPoints(...p: Point[]) {
        if (p.length == 0) {
            return this;
        }
        if (this.faces.length == 0) {
            if (this.defaultEmpty) {
                let pt = p.pop();
                let pl = new Plane(new Point(0, 0, 1), pt.z);
                let f = new ConvexPoly(pl, true);
                let p2 = pl.uvw(pt);
                f.addPoints(p2.xy)
                this.faces.push(f);
                if (p.length == 0) {
                    return this;
                }
            } else {
                return this;
            }
        }
        while (this.faces.length == 1 && this.faces[0].points.length <= 2 && this.faces[0].points.length > 0 && this.faces[0].defaultEmpty == true) {
            //exceptional case of plane normal unable to be defined
            //hence face has 1-2 points
            let f = this.faces[0];
            if (f.points.length == 1) {
                //check not coPoint
                let pt = p.pop();
                let pf = f.corner(0);
                if (pt.sub(pf).mag2() > this.epsilon) {
                    //find new normal
                    let n = pt.sub(pf).normEq().perp;
                    let pl = new Plane(n, 0);
                    let ptuvw = pl.uvw(pt);
                    let pfuvw = pl.uvw(pf);
                    pl.distance = ptuvw.z;
                    this.faces[0] = new ConvexPoly(pl, true);
                    this.faces[0].addPoints(ptuvw.xy, pfuvw.xy);
                    (this.faces[0].lines.get(0) as any).face = this.faces[0];
                    (this.faces[0].lines.get(1) as any).face = this.faces[0];
                }
                if (p.length == 0) {
                    return this;
                }
            }
            f = this.faces[0];
            if (f.points.length == 2) {
                //check not co-linear
                let pt = p.pop();
                let ptuvw = f.plane.uvw(pt);
                if (ptuvw.z ** 2 < this.epsilon) {
                    //not co-planar, would've been if colinear so no need to check for that
                    let pf1 = f.corner(0);
                    let pf2 = f.corner(1);
                    let n = pt.sub(pf1).crossEq(pt.sub(pf2)).normEq();
                    let pl = new Plane(n, 0);

                    let pf1uvw = pl.uvw(pf1);
                    pl.distance = pf1uvw.z;
                    let f1 = new ConvexPoly(pl, true);
                    let pl2 = new Plane(pl.normal.scale(-1), -pl.distance);
                    let f2 = new ConvexPoly(pl2, true);
                    let uv1 = pf1uvw.xy;
                    let uv2 = pl.uvw(pf1).xy;
                    let uv3 = pl.uvw(pf2).xy;
                    f1.addPoints(uv1, uv2, uv3);
                    f2.addPoints(uv1.scale(-1), uv2.scale(-1), uv3.scale(-1));
                    for (let l of f1.lines) {
                        (l as any).face = f2;
                    }
                    for (let l of f2.lines) {
                        (l as any).face = f1;
                    }
                    this.faces = [f1, f2];
                } else {
                    //colinear?
                    f.addPoints(ptuvw.xy);
                    if (f.points.length == 2) {
                        //was colinear
                        for (let l of f.lines) {
                            (l as any).face = f;
                        }
                    } else {
                        //we got a triangle now
                        let f2 = new ConvexPoly(new Plane(f.plane.normal.scale(-1), -f.plane.distance), true);
                        for (let p of f.points) {
                            f2.addPoints(p.scale(-1));
                        }
                        for (let l of f.lines) {
                            (l as any).face = f2;
                        }
                        for (let l of f2.lines) {
                            (l as any).face = f;
                        }
                        this.faces.push(f2);
                    }
                }
                if (p.length == 0) {
                    return this;
                }
            }
        }
        if (this.faces.length == 1 && this.faces[0].defaultEmpty == false) {
            //this convexhull is just a plane
            for (let pt of p) {
                this.faces[0].plane.distance = this.faces[0].plane.uvw(pt).z;
            }
            return this;
        }



        //classify the remaining points
        for (let f of this.faces) {
            (f as any).visiblePoints = [];
            (f as any).farthestVisiblePoint = null;
            let maxv = 0;
            for (let pt of p) {
                let v = f.plane.uvw(pt).z;
                if (v >= 0) {
                    (f as any).visiblePoints.push(pt);

                }
                if (v > maxv) {
                    maxv = v;
                    (f as any).farthestVisiblePoint = pt;
                }
            }
            (f as any).visible = new Set((f as any).visiblePoints);
        }
        //todo: edge case of adding points to a planar convexhull


        for (let i = 0; i < this.faces.length; i++) {
            let foi = this.faces[i];
            if ((foi as any).farthestVisiblePoint != null) {
                let pt = (foi as any).farthestVisiblePoint;


                // compute horison loop
                let newFaces: ConvexPoly[] = [];
                let horizon: [ConvexPoly, number][] = [];
                for (let j = 0; j < this.faces.length; j++) {
                    let f = this.faces[j];
                    if ((f as any).visible.has(pt)) {
                        for (let s = 0; s < f.lines.length; s++) {
                            if (!((f.lines.get(s) as any).face as any).visible.has(pt)) {
                                horizon.push([f, s]);
                            }
                        }
                    } else {
                        newFaces.push(f);
                    }
                }


                function getFace(f: ConvexPoly, sid: number, p: Point): ConvexPoly {
                    let s = f.lines.get(sid);
                    if (s.start == -Infinity) {
                        if (s.end == Infinity) {
                            //todo
                        } else {

                        }
                    }//todo
                    let n1 = f.plane.fromUVW(new Point(s.x, s.y, 0));
                    let n2 = f.plane.normal;
                    let sd = n1.cross(n2);
                    //let p1 = f.plane.fromUVW(new Point(s.cc.x, s.cc, y));
                    //let p2 = f.plane.fromUVW(new Point(s.c.x, s.c, y));
                    let pl = f.plane.fromUVW(new Point(...s.l_fromUV(new Point2D(0, 0)).xy, 0));
                    let n = sd.crossEq(p.sub(pl)).normEq();
                    let r = new Plane(n, 0);
                    let p0 = r.uvw(p);
                    r.distance = p0.z;
                    let ln = r.uvw(n1).xy.normEq();//get normal of line
                    let ld = r.uvw(pl).xy.mag();
                    let fr = new ConvexPoly(r, false);
                    let l = new Point(ln.x, ln.y, ld);
                    (l as any).face = f;
                    fr.addLines(l);
                    return fr;
                }

                // add a new face for every horizon edge
                let addedFaces: ConvexPoly[] = [];
                for (let h of horizon) {
                    let f = getFace(h[0], h[1], pt);
                    addedFaces.push(f);
                    newFaces.push(f);
                }

                // now do the intersections of these faces;
                for (let faceOfInterest of addedFaces) {
                    let intrs: Line2D[] = [];
                    for (let f of addedFaces) {
                        if (f != faceOfInterest) {
                            let il = faceOfInterest.plane.intersectionLine(f.plane).l_norm(1) as Line2D;
                            if (il.xy.mag2() > this.epsilon) {
                                (il as any).face = f;
                                intrs.push(il);
                            }
                        }
                    }
                    faceOfInterest.addLines(...intrs);
                    //add it's effects on all it's interesctednsr faces
                    for (let i = 0; i < faceOfInterest.lines.length; i++) {
                        let f2 = (faceOfInterest.lines.get(i) as any).face as ConvexPoly;
                        let l = f2.plane.intersectionLine(faceOfInterest.plane).l_norm(1) as Line2D;
                        (l as any).face = faceOfInterest;
                        f2.addLines(l);
                    }
                }
                this.faces = newFaces;

                i = 0; //restart iter
            }

        }
        return this;

    }


    setFromPlanes(...l: Plane[]) {
        this.faces = [];
        this.defaultEmpty = false;
        return this.addPlanes(...l);
    }
    addPlanes(...p: Plane[]) {
        for (let pl of p) {
            this.addPlane(pl);
        }
        return this;
    }
    addPlane(p: Plane) {
        if (this.faces.length == 0 && this.defaultEmpty) {
            return this;
        }
        let intrs: Line2D[] = [];
        for (let f of this.faces) {
            let il = p.intersectionLine(f.plane).l_norm(1) as Line2D;
            if (il.xy.mag2() > this.epsilon) {
                (il as any).face = f;
                intrs.push(il);
            }
        }
        let face = new ConvexPoly(p, false);
        face.addLines(...intrs);
        if (face.lines.length == 0 && face.defaultEmpty) {
            //face has no affect
            return this;
        }

        //add it's effects on all it's interesctednsr faces
        for (let i = 0; i < face.lines.length; i++) {
            let f2 = (face.lines.get(i) as any).face as ConvexPoly;
            let l = f2.plane.intersectionLine(p).l_norm(1) as Line2D;
            (l as any).face = face;
            f2.addLines(l);
        }
        this.faces.push(face);
        return this;
    }

    geometry(): THREE.BufferGeometry {

        let res = new THREE.BufferGeometry();
        let fs: number[] = [];
        for (let f of this.faces) {
            fs.push(...trifan(f.pointList()));
            //fs.push(new THREE.Triangle(f.plane.normal
        }
        res.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fs), 3));
        return res;
    }

    getNearestSurface_and_dist(p: Point): [ConvexPoly, number] | null {
        if (this.faces.length == 0) {
            return null;
        }

		/*
		//important for knowing if we went around or not
		let index = 0;
		let startingNormal = this.faces[index].plane.normal;
		*/
        //nah, for now just go through all the planes

        let closestDist = Infinity;
        let closestFace = null;
        for (let f of this.faces) {
            let d = f.eval(p);
            if (d < closestDist) {
                closestDist = d;
                closestFace = f;
            }
        }
        return [closestFace, closestDist];
    }

    eval(p: Point, r = Infinity): number {
        let f = this.getNearestSurface_and_dist(p);
        if (f == null) {
            return Infinity;
        }
        if (f[0].containsInPlane(p)) {
            return -f[1];
        }
        return f[1];
    }
    gradient(p: Point): Point {
        let f = this.getNearestSurface_and_dist(p);
        if (f == null) {
            return new Point(0, 1, 0);
        }
        if (f[0].containsInPlane(p)) {
            return f[0].gradient(p).scale(-1);
        }
        return f[0].gradient(p);
    }
	/*
    addPoints(...p: Point[]): ConvexHull {
        if (p.length == 0) {
            return this;
        }
        if (this.points.length == 0) {
            this.points.push(p.pop());
        }
        if (this.points.length == 1) {
            //not co-point
            let cp = p.pop();
            while (cp.sub(this.points[0]).mag2() < this.epsilon * this.epsilon) {
                if (p.length == 0) {
                    return this;
                }
                cp = p.pop();
            }
            this.points.push(cp);
        }
        if (this.points.length == 2) {
            //not co-linear
            let cp = p.pop();
            while (cp.sub(this.points[1]).crossEq(this.points[0].sub(this.points[1])).mag2 < this.epsilon * this.epsilon) {
                if (p.length == 0) {
                    return this;
                }
                cp = p.pop();
            }
            this.points.push(cp);
            //create first 2 faces
            let fn1 = this.points[1].sub(this.points[0]).crossEq(this.points[2].sub(this.points[0]));
            let f1 = new Plane(
                this.faces
        }

    }
*/



}



export {
    Point, Quaternion, Color, Sphere, Box, ConvexPoly, Plane, Line, LineSegment, Point2D, ConvexHull, AffineTransform, IDENTITY_TRANSFORM
}
