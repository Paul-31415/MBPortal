



class Dat {
    constructor(public d: DataView, public i = 0, public littleEndian = true, public debugLog = false) { }
    readUint32() {
        this.i += 4;
        return this.d.getUint32(this.i - 4, this.littleEndian);
    }
    readUint16() {
        this.i += 2;
        return this.d.getUint16(this.i - 2, this.littleEndian);
    }
    readUint8() {
        this.i += 1;
        return this.d.getUint8(this.i - 1);
    }
    readInt32() {
        this.i += 4;
        return this.d.getInt32(this.i - 4, this.littleEndian);
    }
    readInt16() {
        this.i += 2;
        return this.d.getInt16(this.i - 2, this.littleEndian);
    }
    readInt8() {
        this.i += 1;
        return this.d.getInt8(this.i - 1);
    }
    readFloat32() {
        this.i += 4;
        return this.d.getFloat32(this.i - 4, this.littleEndian);
    }
    readFloat64() {
        this.i += 8;
        return this.d.getFloat64(this.i - 8, this.littleEndian);
    }
    readBoolean() {
        this.i += 1;
        return this.d.getInt8(this.i - 1) != 0;
    }
    skipBytes(n: number) {
        this.i += n;
    }
}
function bytes_match(d: Dat, s: number[]) {
    let matched = true;
    for (let b of s) {
        matched = matched && (d.readUint8() == b);
    }
    return matched;
}
abstract class Parse {
    constructor(d: Dat | null = null) {
        if (d) {
            this.load(d);
        }
    }
    load(d: Dat) {

    }
}


class PNG extends Parse {
    passes_signature: boolean;
    chunks: PNG_Chunk[];
    load(d: Dat) {
        this.passes_signature = bytes_match(d, [137, 80, 78, 71, 13, 10, 26, 10]);
        this.chunks = [];
        while (true) {
            let c = new PNG_Chunk(d);
            this.chunks.push(c);
            if (c.typestr == "IEND")
                break;
        }
    }
}
class PNG_Chunk extends Parse {
    length: number;
    typecode: number[];
    typestr: string;
    datastart: number;
    crc: number;
    load(d: Dat) {
        this.length = d.readUint32();
        this.typecode = [d.readUint8(), d.readUint8(), d.readUint8(), d.readUint8()];
        this.typestr = String.fromCharCode(this.typecode[0]) + String.fromCharCode(this.typecode[1]) +
            String.fromCharCode(this.typecode[2]) + String.fromCharCode(this.typecode[3]);
        this.datastart = d.i
        d.skipBytes(this.length);
        this.crc = d.readUint32();
    }
}

export class InteriorResource extends Parse {
    interiorResourceFileVersion: number;
    previewIncluded: boolean;
    previewBitmap: PNG;
    numDetailLevels: number;
    interiors: Interior[];

    load(d: Dat) {
        this.interiorResourceFileVersion = d.readUint32();
        this.previewIncluded = d.readBoolean()
        if (this.previewIncluded)
            this.previewBitmap = new PNG(d);
        this.numDetailLevels = d.readUint32();
        this.interiors = [];
        for (let i = 0; i < this.numDetailLevels; i++)
            this.interiors[i] = new Interior(d);
    }

}
class Point3F extends Parse {
    x: number;
    y: number;
    z: number;
    load(d: Dat) {
        this.x = d.readFloat32();
        this.y = d.readFloat32();
        this.z = d.readFloat32();
    }
    invCache: Point3F | null = null;
    get inverted(): Point3F {
        if (this.invCache)
            return this.invCache;
        this.invCache = new Point3F();
        this.invCache.x = -this.x;
        this.invCache.y = -this.y;
        this.invCache.z = -this.z;
        this.invCache.invCache = this;
        return this.invCache;
    }
}
class BoxF extends Parse {
    low: Point3F;
    high: Point3F;
    load(d: Dat) {
        this.low = new Point3F(d);
        this.high = new Point3F(d);
    }
}
class SphereF extends Parse {
    center: Point3F;
    radius: number;
    load(d: Dat) {
        this.center = new Point3F(d);
        this.radius = d.readFloat32();
    }
}
class PlaneF extends Parse {
    distance: number;
    normal: Point3F;
    constructor(d: Point3F | Dat, dis: number | null = null) {
        super(dis ? null : d as Dat);
        if (dis) {
            this.distance = dis;
            this.normal = d as Point3F;
        }
    }
    load(d: Dat) {
        this.normal = new Point3F(d);
        this.distance = d.readFloat32();
    }
    invCache: PlaneF | null = null;
    get inverted(): PlaneF {
        if (this.invCache)
            return this.invCache;
        this.invCache = new PlaneF(this.normal.inverted, -this.distance);
        this.invCache.invCache = this;
        return this.invCache;
    }
}
class TexGenEq extends Parse {
    planeX: PlaneF;
    planeY: PlaneF;
    load(d: Dat) {
        this.planeX = new PlaneF(d);
        this.planeY = new PlaneF(d);
    }
}


class Interior extends Parse {
    interiorFileVersion: number;
    detailLevel: number;
    minPixels: number;
    boundingBox: BoxF;
    boundingSphere: SphereF;
    hasAlarmState: boolean;
    numLightStateEntries: number;
    numNormals: number;
    normals: Point3F[];
    numPlanes: number;
    mPlanes: PlaneF[];
    numPoints: number;
    mPoints: Point3F[];
    numPointVisibilities: number;
    mPointVisibilities: number[];
    numTexGenEqs: number;
    mTexGenEqs: TexGenEq[];
    numBSPNodes: number;
    mBSPNodes: { planeIndex: number, frontIndex: number, backIndex: number }[];
    numBSPSolidLeaves: number;
    mBSPSolidLeaves: { surfaceIndex: number, surfaceCount: number }[];
    getPlane(n: number): PlaneF {
        if (n & 0x8000) {
            return this.mPlanes[n & 0x7fff].inverted;
        }
        return this.mPlanes[n];
    }

    load(d: Dat) {
        this.interiorFileVersion = d.readUint32();
        this.detailLevel = d.readUint32();
        this.minPixels = d.readUint32();
        this.boundingBox = new BoxF(d);
        this.boundingSphere = new SphereF(d);
        this.hasAlarmState = d.readBoolean();
        this.numLightStateEntries = d.readUint32();
        this.numNormals = d.readUint32();
        this.normals = [];
        for (let i = 0; i < this.numNormals; i++)
            this.normals[i] = new Point3F(d);
        this.numPlanes = d.readUint32();
        this.mPlanes = [];
        for (let i = 0; i < this.numPlanes; i++)
            this.mPlanes[i] = new PlaneF(this.normals[d.readUint32()], d.readFloat32());
        this.numPoints = d.readUint32();
        this.mPoints = [];
        for (let i = 0; i < this.numPoints; i++)
            this.mPoints[i] = new Point3F(d);
        this.numPointVisibilities = d.readUint32();
        this.mPointVisibilities = [];
        for (let i = 0; i < this.numPointVisibilities; i++)
            this.mPointVisibilities[i] = d.readUint8();
        this.numTexGenEqs = d.readUint32();
        this.mTexGenEqs = [];
        for (let i = 0; i < this.numTexGenEqs; i++)
            this.mTexGenEqs[i] = new TexGenEq(d);
        this.numBSPNodes = d.readUint32();
        this.mBSPNodes = [];
        for (let i = 0; i < this.numBSPNodes; i++)
            this.mBSPNodes[i] = { planeIndex: d.readUint16(), frontIndex: d.readUint32(), backIndex: d.readUint32() };
        this.numBSPSolidLeaves = d.readUint32();
        this.mBSPSolidLeaves = [];
        for (let i = 0; i < this.numBSPSolidLeaves; i++)
            this.mBSPSolidLeaves[i] = { surfaceIndex: d.readUint32(), surfaceCount: d.readUint16() };
        //this.MaterialList = {version:number,numMaterials:number,mMaterials:;
        //this.Mate


    }
}
