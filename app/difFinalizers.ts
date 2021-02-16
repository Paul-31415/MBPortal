//
import { Point, Color, Box, Sphere, Plane, ConvexHull } from "./3dTypes";
import * as THREE from "three";


let DifFinalizers: { [key: string]: (s: any) => any } = {};


DifFinalizers.BoxF = (s: any) => { return new Box(s.low, s.high); };
DifFinalizers.Point3F = (s: any) => { return new Point(s.x, s.y, s.z); };
DifFinalizers.SphereF = (s: any) => { return new Sphere(s.center, s.radius); };
DifFinalizers.PlaneF = (s: any) => { return new Plane(s.normal, s.distance); };
DifFinalizers.ColorF = (s: any) => { return new Color(s.red, s.green, s.blue, s.alpha); };
DifFinalizers.ColorI = DifFinalizers.ColorF;
DifFinalizers.String = (s: any) => { return String.fromCharCode(...s.gth); };
DifFinalizers.MaterialList = (s: any) => { return new MaterialList(s.version, s.Materials); };
DifFinalizers.LightMapTexGen = (s: any) => { return new LightMapTexGen(s.finalWord, s.texGenXDistance, s.texGenYDistance); };
DifFinalizers.ItrGameEntity = (s: any) => { return new ItrGameEntity(s.datablock, s.gameClass, s.position, s.properties); }
DifFinalizers.Dictionary = (s: any) => {
    let r: any = {};
    for (let o of s.e) {
        r[o.name] = o.value;
    }
    return r;
}
class ConvexHullGenerator {
    constructor(public hullStart: number
        , public hullCount: number
        , public minX: number
        , public maxX: number
        , public minY: number
        , public maxY: number
        , public minZ: number
        , public maxZ: number
        , public surfaceStart: number
        , public surfaceCount: number
        , public planeStart: number
        , public polyListPlaneStart: number
        , public polyListPointStart: number
        , public polyListStringStart: number) { }

}
DifFinalizers.ConvexHull = (s: any) => {
    return new ConvexHullGenerator(s.hullStart
        , s.hullCount
        , s.minX
        , s.maxX
        , s.minY
        , s.maxY
        , s.minZ
        , s.maxZ
        , s.surfaceStart
        , s.surfaceCount
        , s.planeStart
        , s.polyListPlaneStart
        , s.polyListPointStart
        , s.polyListStringStart);
}
DifFinalizers.NullSurface = (s: any) => {
    return new NullSurface(s.windingStart
        , s.planeIndex
        , s.surfaceFlags
        , s.windingCount);
};
DifFinalizers.VehicleNullSurface = DifFinalizers.NullSurface;
DifFinalizers.VehicleCollision = (s: any) => {
    return new VehicleCollision(s.vehicleCollisionFileVersion,
        s.VehicleConvexHulls,
        String.fromCharCode(...s.VehicleConvexHullEmitStrings),
        s.VehicleHullIndices,
        s.VehicleHullPlaneIndices,
        s.VehicleHullEmitStringIndices,
        s.VehicleHullSurfaceIndices,
        s.VehiclePolyListPlanes,
        s.VehiclePolyListPoints,
        String.fromCharCode(...s.VehiclePolyListStrings),
        s.VehicleNullSurfaces);
}



class MaterialList {
    constructor(public version: number, public materials: string[]) { }
    get numMaterials(): number {
        return this.materials.length;
    }
}
class LightMapTexGen {
    constructor(public finalWord: number, public x: number, public y: number) { }
}
class ItrGameEntity {
    constructor(public datablock: string, public gameClass: string, public position: Point, public properties: { [key: string]: string }) { }
}

class NullSurface {
    constructor(public windingStart: number, public planeIndex: number, public surfaceFlags: number, public windingCount: number) { }
}

class VehicleCollision {
    constructor(public version: number, public vehicleConvexHulls: ConvexHull[], public vehicleConvexHullEmitString: string, public vehicleHullIndices: number[], public vehicleHullPlaneIndices: number[], public vehicleHullEmitStringIndices: number[], public vehicleHullSurfaceIndices: number[], public vehiclePolyListPlanes: number[], public vehiclePolyListPoints: number[], public vehiclePolyListStrings: string, public vehicleNullSurfaces: NullSurface[]) { }

}

function unpackArr<T>(arr: { [key: string]: T }[], key: string): T[] {
    let ans: T[] = [];
    for (let i = 0; i < arr.length; i++) {
        ans[i] = arr[i][key];
    }
    return ans;
}

DifFinalizers.Interior = (s: any) => {
    return new Interior(s);
}
class Interior {
    source: any;
    public boundingBox: Box;
    public boundingSphere: Sphere;
    version: number;
    detailLevel: number;
    minPixels: number;
    hasAlarmState: boolean;
    lightStates: number;
    normals: Point[];
    planes: Plane[];
    points: Point[];
    pointViss: number[];
    texGenEQs: { planeX: Plane, planeY: Plane }[];
    BSPNodes: {
        planeIndex: number,
        frontIndex: number,
        backIndex: number
    }[];
    BSPSolidLeaves: {
        surfaceIndex: number,
        surfaceCount: number
    }[];
    materials: MaterialList;
    windings: number[];
    windingIndices: {
        windingStart: number,
        windingCount: number
    }[];
    zones: {
        portalStart: number,
        portalCount: number,
        surfaceStart: number,
        surfaceCount: number
    }[];
    zoneSurfaces: number[];


    convexHulls: ConvexHull[];
    convexHullEmitStrings: number[];
    hullIndices: number[];
    hullPlaneIndices: number[];
    hullEmitStringIndices: number[];
    hullSurfaceIndices: number[];
    polyListPlanes: number[];
    polyListPoints: number[];
    polyListStrings: number[];


    surfaces: {
        windingStart: number,
        windingCount: number,
        planeIndex: number,
        textureIndex: number,
        texGenIndex: number,
        surfaceFlags: number,
        fanMask: number,
        LightMapTexGen: LightMapTexGen,
        lightCount: number,
        lightStateInfoStart: number,
        mapOffsetX: number,
        mapOffsetY: number,
        mapSizeX: number,
        mapSizeY: number
    }[];


    constructor(s: any = null) {
        if (s == null) {
            return
        }
        this.source = s;
        this.version = s.interiorFileVersion;
        this.detailLevel = s.detailLevel;
        this.minPixels = s.minPixels;
        this.boundingBox = s.boundingBox;
        this.boundingSphere = s.boundingSphere;
        this.hasAlarmState = s.hasAlarmState;
        this.lightStates = s.numLightStateEntries;
        this.normals = unpackArr(s.Normals, "normal");

        this.planes = [];
        for (let i = 0; i < s.numPlanes; i++) {
            this.planes[i] = new Plane(this.normals[s.Planes[i].normalIndex], -s.Planes[i].planeDistance);
        }

        this.surfaces = s.Surfaces;

        this.points = s.Points;
        this.pointViss = s.PointVisibilities;
        this.texGenEQs = s.TexGenEQs;
        this.BSPNodes = s.BSPNodes;
        this.BSPSolidLeaves = s.BSPSolidLeaves;
        this.materials = s.materials;


        //get the convexhulls



        this.convexHullEmitStrings = unpackArr(s.ConvexHullEmitStrings, "convexHullEmitStringCharacter");
        this.hullIndices = unpackArr(s.HullIndices, "hullIndex");
        this.hullPlaneIndices = unpackArr(s.HullPlaneIndices, "hullPlaneIndex");
        this.hullEmitStringIndices = unpackArr(s.HullEmitStringIndices, "hullEmitStringIndex");
        this.hullSurfaceIndices = unpackArr(s.HullSurfaceIndices, "hullSurfaceIndex");
        this.polyListPlanes = unpackArr(s.PolyListPlanes, "ployListPlaneIndex");
        this.polyListPoints = unpackArr(s.PolyListPoints, "polyListPointIndex");
        this.polyListStrings = unpackArr(s.PolyListStrings, "polyListStringCharacter");
        this.convexHulls = [];
        let hack = 0;
        for (let i = 0; i < s.numConvexHulls; i++) {
            let h = s.ConvexHulls[i].ConvexHull as ConvexHullGenerator;
			/*
			hullStart  - indices into points
			hullCount
			minX
			maxX
			minY
			maxY
			minZ
			maxZ
			surfaceStart  - refs list of surfaces
			surfaceCount
			planeStart
			polyListPlaneStart
			polyListPointStart
			polyListStringStart

			
mHullIndices
     These remap the local point indices of the convex hulls to the Interior's mPoints array.
mHullPlaneIndices
     These remap the local plane indices of the convex hulls to the Interior's mPlanes array.
mHullEmitStringIndices
     The hull emit string indices are a list of indices into the mConvexHullEmitStrings (which can be shared by multiple hull points). There
     should be an emit string index for each point on each hull (as referenced by hullStart and hullCount).
mHullSurfaceIndices
      A list of indices into mSurfaces which indicates which surfaces belong to which convex collision hull (as referenced by surfaceStart and surfaceCount).
      Null surface indices are masked by 0x80000000.
mPolyListPlanes
     These remap the local plane indices of the convex hulls to the Interior's mPlanes array.
mPolyListPoints
     These remap the local point indices of the convex hulls to the Interior's mPoints array.
mPolyListStrings
     The poly list strings are used for quickly getting at the geometry data of the convex hulls. It must describe a closed convex volume.
     This data can easily be generated by processHullPolyLists() if the convex hull surfaces are already set up. The format is:
          numPlanes
             for 0 to numPlanes
                a relative index into mPolyListPlanes
          numPoints high byte
          numPoints low byte
               for 0 to numPoints
                    a relative index into mPolyListPoints
          numSurfaces
               for 0 to numSurfaces
                    numSurfacePoints
                    mask
                    a relative index into the plane list above
                         for 0 to numSurfacePoints
                              a relative index into the poly list above high bit
                              a relative index into the poly list above low bit
			*/


            let surfaces: Plane[] = [];

            let pli = +h.polyListStringStart;
            //skip to surfaces
            //process planes though
            let planes: Plane[] = [];
            let numPlanes = this.polyListStrings[pli];
            for (let pl = 0; pl < numPlanes; pl++) {
                pli++;
                planes[pl] = this.getPlane(this.polyListPlanes[h.polyListPlaneStart + this.polyListStrings[pli]]);
            }
            pli++;
            let len = this.polyListStrings[pli] * 256 + this.polyListStrings[pli + 1];
            pli++;
            //skip points
            pli += len;
            pli++;
            let numSurfaces = this.polyListStrings[pli];

            for (let sf = 0; sf < numSurfaces; sf++) {
                pli++;
                let numSfPts = this.polyListStrings[pli];
                pli++;
                let mask = this.polyListStrings[pli];
                pli++;
                //surfaces[sf] = this.getPlane(this.hullPlaneIndices[h.planeStart + sf]);
                surfaces.push(planes[this.polyListStrings[pli]]);
                pli += numSfPts * 2;
            }
            surfaces = [];
            for (let sf = 0; sf < [8, 6, 6, 6, 6, 6, 5][hack]; sf++) {//first one somehow gets 8, second 6, then 6, then 6,then 6, then 6, then 6
                //looking for 8,6,6,6,6,6,6
                //first polylist is 48 long
                surfaces[sf] = this.getPlane(this.surfaces[this.hullSurfaceIndices[h.surfaceStart + sf]].planeIndex);
            }
            hack++;
            /*for (let pl = 0; pl < numPlanes; pl++) {
			  surfaces.push(this.getPlane(this.hullPlaneIndices[h.planeStart + pl]));
			  }*/
            this.convexHulls[i] = new ConvexHull(false);
            this.convexHulls[i].addPlanes(...surfaces);
        }

    }

    getPlane(i: number): Plane {
        if ((i & 0x8000) == 0) {
            return this.planes[i];
        }
        return new Plane(this.planes[i & 0x7fff].normal.scale(-1), this.planes[i & 0x7fff].distance);
    }

    graphic(o: THREE.Object3D) {
        let m = new THREE.MeshStandardMaterial({ color: 0x808080 });
        for (let c of this.convexHulls) {
            let g = c.geometry();
            g.computeVertexNormals();
            o.children.push(new THREE.Mesh(g, m));
        }
        /*let pts = new THREE.MeshStandardMaterial({ color: 0x6060e0 });
        for (let p of this.points) {
            let g = new THREE.SphereGeometry(0.1, 32, 16);
            g.translate(p.x, p.y, p.z);
            o.children.push(new THREE.Mesh(g, pts));
        }*/
    }
}









class Dif {
    interiors: Interior[];
    constructor(s: any) {
        this.interiors = [];
        for (let i = 0; i < s.numDetailLevels; i++) {
            this.interiors[i] = s.DetailLevels[i].Interior;
        }
    }
}
export {
    DifFinalizers, Dif, Interior
}

