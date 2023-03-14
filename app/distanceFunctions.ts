
import { Point, Box, Sphere, AffineTransform, IDENTITY_TRANSFORM } from "./3dTypes";
import * as THREE from "three";



abstract class DistanceFunction {
    constructor() { }
    epsilon?: number = .00001;
    //potentially optimized, only needs to be correct when the true distance or the returned distance is < radius
    abstract eval(p: Point, radius?: number, transform?: AffineTransform): number;
    //returns the distance from p to the transformed object, if the distance is known to be above radius, Infinity can be returned, saving compute time


    gradient(p: Point, t = IDENTITY_TRANSFORM): Point {
        //numerical approx to gradient
        const d = this.eval(p, Infinity, t);
        return new Point((this.eval(p.add(new Point(this.epsilon)), Infinity, t) - d) / this.epsilon,
            (this.eval(p.add(new Point(0, this.epsilon)), Infinity, t) - d) / this.epsilon,
            (this.eval(p.add(new Point(0, 0, this.epsilon)), Infinity, t) - d) / this.epsilon).scaleEq(.5).addEq(
                new Point((this.eval(p.add(new Point(-this.epsilon)), Infinity, t) - d) / this.epsilon,
                    (this.eval(p.add(new Point(0, -this.epsilon)), Infinity, t) - d) / this.epsilon,
                    (this.eval(p.add(new Point(0, 0, -this.epsilon)), Infinity, t) - d) / this.epsilon).scaleEq(.5));

    }
    get boundingBox(): Box {
        return new Box(new Point(-Infinity, -Infinity, -Infinity), new Point(Infinity, Infinity, Infinity));
    }
    get boundingSphere(): Sphere {
        return new Sphere(new Point(0, 0, 0), Infinity);
    }
}
/*class df_Func extends DistanceFunction {
    constructor(public f: (p: Point) => number) { super(); }
    eval(p: Point, r: number = Infinity): number {
        return this.f(p);
    }
}*/


// https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
let min = Math.min;
let sign = Math.sign;
let dot = function(a: Point, b: Point): number { return a.dot(b); }
let dot2 = function(a: Point): number { return a.dot(a); }
let cross = function(a: Point, b: Point): Point { return a.cross(b); }
let clamp = function(n: number, l = 0, h = 1): number { return Math.min(Math.max(n, l), h); }
let minMag = function(...ps: Point[]): Point {
    let m = new Point();
    let M = Infinity;
    for (let p of ps) {
        const m2 = p.mag2();
        if (m2 < M) {
            M = m2;
            m = p;
        }
    }
    return m;
}
let maxMag = function(...ps: Point[]): Point {
    let m = new Point();
    let M = 0;
    for (let p of ps) {
        const m2 = p.mag2();
        if (m2 > M) {
            M = m2;
            m = p;
        }
    }
    return m;
}
export function triBarycentric(p:Point,a:Point,b:Point,c:Point):Point{
    //signed ratio of areas
    let ap = a.sub(p);
    let bp = b.sub(p);
    let cp = c.sub(p);
    let nor = a.sub(c).cross(b.sub(c));
    let ab = ap.cross(bp);
    let bc = bp.cross(cp);
    let ca = cp.cross(ap);
    return new Point(bc.dot(nor),ca.dot(nor),ab.dot(nor)).unscaleEq(nor.mag2());
}
export function triNearest(p:Point,a:Point,b:Point,c:Point):Point{
    let ba = b.sub(a); let pa = p.sub(a);
    let cb = c.sub(b); let pb = p.sub(b);
    let ac = a.sub(c); let pc = p.sub(c);
    let nor = cb.cross(ac);
    nor.unscaleEq(nor.mag2());

    let x = pb.cross(pc).dot(nor);
    let y = pc.cross(pa).dot(nor);
    let z = pa.cross(pb).dot(nor);
    if (x >= 0 && y >= 0 && z >= 0){
        return new Point(x,y,z).recompose(a,b,c);
    }
    let ma = pa.mag2();
    let mb = pb.mag2();
    let mc = pc.mag2();

    let f = ma > mb? (ma > mc ? 0 : 2) : (mb > mc ? 1 : 2);
    let l = [cb,ac,ba][f];
    let o = [b,c,a][f];
    let po = [pb,pc,pa][f];
    return o.add(l.scale(clamp(l.component(po),0,1)));
}


class df_Tri implements DistanceFunction {
    constructor(public a: Point, public b: Point, public c: Point) { }
    closestPoint(p: Point, t: AffineTransform = null): Point {
        let a = t == null ? this.a : t.apply(this.a);
        let b = t == null ? this.b : t.apply(this.b);
        let c = t == null ? this.c : t.apply(this.c);

        let ba = b.sub(a); let pa = p.sub(a);
        let cb = c.sub(b); let pb = p.sub(b);
        let ac = a.sub(c); let pc = p.sub(c);
        let nor = ba.cross(ac);

        if ((sign(dot(cross(ba, nor), pa)) +
            sign(dot(cross(cb, nor), pb)) +
            sign(dot(cross(ac, nor), pc))) < 2) {

            // mag2( ba*[ba•pa/ba•ba]-pa)
            //=mag2((b-a)*[(b-a)•(p-a)/(b-a)•(b-a)]-(p-a))
            //so (b-a)*[(b-a)•(p-a)/(b-a)•(b-a)]-p is closest point along that edge

            return minMag(a.lerp(b, clamp(dot(ba, pa) / dot2(ba), 0.0, 1.0)).subEq(p),
                b.lerp(c, clamp(dot(cb, pb) / dot2(cb), 0.0, 1.0)).subEq(p),
                c.lerp(a, clamp(dot(ac, pc) / dot2(ac), 0.0, 1.0)).subEq(p)).addEq(p);

        } else {
            return (p.sub(pa.extractComponent(nor)));
        }
    }
    eval(p: Point, rad: number = Infinity, t: AffineTransform = null): number {
        let a = t == null ? this.a : t.apply(this.a);
        let b = t == null ? this.b : t.apply(this.b);
        let c = t == null ? this.c : t.apply(this.c);
        let ba = b.sub(a); let pa = p.sub(a);
        let cb = c.sub(b); let pb = p.sub(b);
        let ac = a.sub(c); let pc = p.sub(c);
        let nor = ba.cross(ac);

        const d2 = ((sign(dot(cross(ba, nor), pa)) +
            sign(dot(cross(cb, nor), pb)) +
            sign(dot(cross(ac, nor), pc))) < 2.0)
            ?
            min(
                dot2(ba.scale(clamp(dot(ba, pa) / dot2(ba), 0.0, 1.0)).subEq(pa)),
                dot2(cb.scale(clamp(dot(cb, pb) / dot2(cb), 0.0, 1.0)).subEq(pb)),
                dot2(ac.scale(clamp(dot(ac, pc) / dot2(ac), 0.0, 1.0)).subEq(pc)))
            :
            dot(nor, pa) * dot(nor, pa) / dot2(nor);

        if (d2 > rad * rad) {
            return Infinity;
        }
        return Math.sqrt(d2);
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        return p.sub(this.closestPoint(p, t)).normEq();
    }
    get boundingBox(): Box {
        return new Box(this.a.min(this.b, this.c), this.a.max(this.b, this.c));
    }
    get boundingSphere(): Sphere {
        //this is like a 5/3 approx or so
        let v = this.a.add(this.b).addEq(this.c).scaleEq(1 / 3);
        return new Sphere(v, Math.sqrt(Math.max(v.sub(this.a).mag2(), v.sub(this.b).mag2(), v.sub(this.c).mag2())));
    }

    getTriangles(): number[] {
        return [...this.a.xyz, ...this.b.xyz, ...this.c.xyz];
    }
}


class df_empty implements DistanceFunction {
    constructor(public grad = new Point(1, 0, 0)) { }
    eval(p: Point, rad: number = Infinity, t = IDENTITY_TRANSFORM): number { return Infinity; }
    gradient(p: Point, t = IDENTITY_TRANSFORM): Point { return this.grad; }
    get boundingBox(): Box {
        return new Box(new Point(Infinity, Infinity, Infinity), new Point(-Infinity, -Infinity, -Infinity));
    }
    get boundingSphere(): Sphere {
        return new Sphere(new Point(0, 0, 0), -Infinity);
    }
}

class df_invert implements DistanceFunction {

    constructor(public df: DistanceFunction) { }
    eval(p: Point, r = Infinity, t: AffineTransform = null) {
        return -this.df.eval(p, Infinity, t);
    }
    gradient(p: Point, t: AffineTransform = null) {
        return this.df.gradient(p, t).negEq();
    }
    get boundingBox(): Box {
        return new Box(new Point(-Infinity, -Infinity, -Infinity), new Point(Infinity, Infinity, Infinity));
    }
    get boundingSphere(): Sphere {
        return new Sphere(new Point(0, 0, 0), Infinity);
    }
}


class df_union implements DistanceFunction {
    public static defaultDf = new df_empty();
    constructor(public dfs: DistanceFunction[]) { }
    eval(p: Point, rad: number, t: AffineTransform = null) {
        let v = Infinity;
        for (let df of this.dfs) {
            v = min(v, df.eval(p, min(rad, v), t));
        }
        return v;
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        let v = Infinity;
        let dfmin: DistanceFunction = df_union.defaultDf;
        for (let df of this.dfs) {
            const d = df.eval(p, v, t);
            if (d < v) {
                dfmin = df;
                v = d;
            }
        }
        return dfmin.gradient(p, t);
    }
    get boundingBox(): Box {
        let box = df_union.defaultDf.boundingBox;
        for (let df of this.dfs) {
            box.boundingUnionEq(df.boundingBox);
        }
        return box;
    }
    get boundingSphere(): Sphere {
        //this is a 2-approx
        let s = df_union.defaultDf.boundingSphere;
        for (let df of this.dfs) {
            s.boundingUnionEq(df.boundingSphere);
        }
        return s;
    }

}

class df_transform extends DistanceFunction {
    constructor(public df: DistanceFunction, public t: AffineTransform) { super(); }
    eval(p: Point, r = Infinity, t: AffineTransform = null) {
        if (t == null) {
            return this.df.eval(p, r, this.t);
        } else {
            return this.df.eval(p, r, t.after(this.t));
        }
    }
    gradient(p: Point, t: AffineTransform = null) {
        if (t == null) {
            return this.df.gradient(p, this.t);
        } else {
            return this.df.gradient(p, t.after(this.t));
        }
    }
    get boundingBox(): Box {
        return this.df.boundingBox.transform(this.t);
    }
}


/*class df_ConvexHull implements DistanceFunction {
    constructor(public hull: THREE.ConvexGeometry) { }


}*/


export {
    DistanceFunction,
    //    df_Func,
    df_Tri,
    df_union,
    df_empty,
    df_invert,
    df_transform
}
