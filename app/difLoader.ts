import { Point } from "./3dTypes";


/*
  decodes torque .dif files

 spec from:
 http://www.rustycode.com/projects/Docs/Torque%20DIF%20File%20(Interiors)%20-%20Format%2044.14.html

*/
type StructDef = { count?: string, rcount?: string, ncount?: number, gcount?: string, countf?: (d: Dat) => number, key: string, value: string, post?: (a: any) => any, globalName?: string, breakpoint?: boolean }[];
type Struct = any;
class Dat {
    constructor(public d: DataView, public i = 0, public littleEndian = true, public debugLog = true) { }
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
    readThing(s: string) {
        let r = this.primitives[s]();
        if (this.debugLog) { console.log(s + " " + r); }
        return r;
    }
    primitives: any = {
        Uint32: this.readUint32.bind(this), Uint16: this.readUint16.bind(this), Uint8: this.readUint8.bind(this),
        Int32: this.readInt32.bind(this), Int16: this.readInt16.bind(this), Int8: this.readInt8.bind(this),
        Float32: this.readFloat32.bind(this), Float64: this.readFloat64.bind(this), Bool: this.readBoolean.bind(this),
        U32: this.readUint32.bind(this), U16: this.readUint16.bind(this), U8: this.readUint8.bind(this),
        S32: this.readInt32.bind(this), S16: this.readInt16.bind(this), S8: this.readInt8.bind(this),
        F32: this.readFloat32.bind(this), F64: this.readFloat64.bind(this), bool: this.readBoolean.bind(this), "null": function(): null { return null; }
    };
    structs: {
        [key: string]: StructDef
    } = {};
    listNeededStructDefs(): string[] {
        let n: { [key: string]: true } = {};
        for (let s in this.structs) {
            for (let d of this.structDependencies(this.structs[s])) {
                if (this.structs[d] == null) {
                    n[d] = true;
                }
            }
        }
        return Object.keys(n);
    }
    structDependencies(s: StructDef): string[] {
        let deps: { [key: string]: true } = {};
        for (let t of s) {
            deps[t.value] = true;
            if (t.count != null) {
                deps[t.count] = true;
            }
        }
        return Object.keys(deps);
    }
    callDebugger = false;
    readStruct(struct: StructDef | string, res: Struct = null, nameSpace: any = {}): Struct {
        if (this.debugLog) { console.log("parsing Struct:"); console.log(struct); if (this.callDebugger) { debugger; } }
        let st: StructDef = (struct as StructDef);
        if (st.push == null) {
            st = this.structs[(struct as string)];
        }
        let r: Struct = (res == null) ? {} : res;
        for (let s of st) {
            if (this.debugLog) { console.log(s); }
            if (s.breakpoint == true) { debugger; }
            let tmp: any = null;
            if (s.count != null || s.rcount != null || s.ncount != null || s.countf != null) {
                let n = 1;
                if (s.count != null) {
                    n = this.readThing(s.count);
                } else {
                    if (s.rcount != null) {
                        n = r[s.rcount];
                    } else {
                        if (s.ncount != null) {
                            n = s.ncount;
                        } else {
                            if (s.countf != null) {
                                n = s.countf(this);
                            } else {
                                n = nameSpace[s.gcount];
                            }
                        }
                    }
                }
                if (this.debugLog) { console.log("Count:" + n); }

                let v: Struct[] = [];
                tmp = v;
                for (let i = 0; i < n; i++) {
                    if (this.primitives[s.value] != null) {
                        v[i] = this.readThing(s.value);
                    } else {
                        v[i] = this.readStruct(s.value, null, nameSpace);
                    }
                }
            } else {
                if (this.primitives[s.value] != null) {
                    tmp = this.readThing(s.value);
                } else {
                    tmp = this.readStruct(s.value, null, nameSpace);
                }
            }
            if (s.post != null) {
                tmp = s.post(tmp);
            }
            if (s.globalName != null) {
                nameSpace[s.globalName] = tmp;
            }
            if (this.debugLog) { console.log("result:"); console.log(tmp); }
            r[s.key] = tmp;
        }
        return r;
    }
    readStructs(struct: string | StructDef, n = 1): Struct[] {
        let r: Struct[] = [];
        for (let i = 0; i < n; i++) {
            r[i] = this.readStruct(struct);
        }
        return r;
    }
    readUint32Structs(struct: string | StructDef): Struct[] {
        return this.readStructs(struct, this.readUint32());
    }
    structFromString(s: string): StructDef {
        let lines = s.match(/[^;]+/g);
        let d: StructDef = [];
        for (let l of lines) {
            let t = l.match(/[^ ]+/g)
            if (t.length == 2) {
                d.push({ value: t[0], key: t[1] });
            } else {
                d.push({ count: t[0], value: t[1], key: t[2] });
            }
        }
        return d;
    }
}


class Dif {
    reader: FileReader;
    constructor(public data: Buffer) { }
    load() {
        this.parse();
		/*
        this.reader.onload = this.parse.bind(this);
        this.reader.readAsBinaryString(this.data);*/
    }
    parse() {
        debugger;
        let arrayBuffer = this.data.buffer;//this.reader.result;
        console.log(this);
        let d = defineNeededStructs(new Dat(new DataView(arrayBuffer as ArrayBuffer), 0, true));
        let res = d.readStruct("World");

    }
}

function defineNeededStructs(d: Dat, iiver: number = 0): Dat {
    //struct defs


    function u32eq(n: number) {
        return function(d: Dat) { return d.readUint32() == n ? 1 : 0; }
    }
    //------------------------------
    //need verification/definitions:

    d.structs.PlaneF = [{ value: "Point3F", key: 'normal' }, { value: "F32", key: "distance" }];


    //verify materialCount
    d.structs.TSMaterialList = [{ gcount: "materialCount", value: "U32", key: "flags" },
    { gcount: "materialCount", value: "U32", key: "reflectanceMap" },
    { gcount: "materialCount", value: "U32", key: "bumpMap" },
    { gcount: "materialCount", value: "U32", key: "detailMap" },
    { gcount: "materialCount", value: "U32", key: "lightMap" },
    { gcount: "materialCount", value: "U32", key: "detailScale" },
    { gcount: "materialCount", value: "U32", key: "reflectionAmount" }];


    d.structs.InteriorSubObject;
    d.structs.Point2I = [{ key: 'x', value: 'S32' }, { key: 'y', value: 'S32' }];
    d.structs.PNG = [{ key: "e", value: "null", post: function(a: any) { throw "can't parse pngs"; } }];

    d.structs.QuatF = [{ key: 'x', value: 'Float32' }, { key: 'y', value: 'Float32' }, { key: 'z', value: 'Float32' }, { key: "w", value: "F32" }];
    d.structs.Point3F = [{ key: 'x', value: 'Float32' }, { key: 'y', value: 'Float32' }, { key: 'z', value: 'Float32' }];
    d.structs.Point2F = [{ key: 'x', value: 'Float32' }, { key: 'y', value: 'Float32' }];

    d.structs.MatrixF = [{ ncount: 9, key: "vals", value: "F32" }];

    //4*6 bytes large
    d.structs.Box3F = [{ key: 'low', value: 'Point3F' }, { key: 'hi', value: 'Point3F' }];
    d.structs.BoxF = d.structs.Box3F;
    //4*4 bytes large
    d.structs.SphereF = [{ key: 'pos', value: 'Point3F' }, { key: 'radius', value: 'Float32' }];
    //------------------------------
    //defined

    d.structs.Plane = [{ key: "normalIndex", value: "Uint32" }, { key: "planeDistance", value: "Float32" }];
    //Spec appears to be different for plane for interiorInstance version 0
    if (iiver == 0) {
        //note that plane def in spec seems to indicate index being an int16 (the |= 0x8000 part)
        d.structs.Plane = [{ key: "normalIndex", value: "Uint16" }, { key: "planeDistance", value: "Float32" }];
    }


    d.structs.TexGenEQ = [{ key: "planeX", value: "PlaneF" }, { key: "planeY", value: "PlaneF" }];
    d.structs.BSPNode = [{ key: "planeIndex", value: "Uint16" }, { key: "frontIndex", value: "Uint32" }, { key: "backIndex", value: "Uint32" }];
    if (iiver == 0) {
        //here the entry on masking seems to be off by one hex digit (0xc0000 should be 0xc000?)
        d.structs.BSPNode = [{ key: "planeIndex", value: "Uint16" }, { key: "frontIndex", value: "Uint16" }, { key: "backIndex", value: "Uint16" }];
    }

    d.structs.BSPSolidLeaf = [{ key: "surfaceIndex", value: "Uint32" }, { key: "surfaceCount", value: "Uint16" }];
    d.structs.String = [{
        count: "Uint8", key: "this", value: "Uint8",
        post: function(r: any) {
            return String.fromCharCode(...(r as number[]));
        }
    }];
    let r: any = {};


    d.structs.World = [{ value: "U32", key: "interiorResourceFileVersion" },
    { count: "bool", key: "previewIncluded", value: "PNG" },
    { count: "U32", key: "detailLevels", value: "Interior" },
    { count: "U32", key: "subObjects", value: "Interior" },
    { count: "U32", key: "triggers", value: "Trigger" },
    { count: "U32", key: "interiorPathFollower", value: "InteriorPathFollower" },
    { count: "U32", key: "forceFields", value: "ForceField" },
    { count: "U32", key: "AISpecialNodes", value: "AISpecialNode" },
    { count: "U32", key: "vehicleCollision", value: "VehicleCollision" },
    { countf: u32eq(2), key: "gameEntities", value: "GameEntities" },
    { value: "Uint32", key: "dummy" }];
    d.structs.Trigger = [{ key: "name", value: "String" },
    { key: "datablock", value: "String" },
    { count: "U32", key: "polyHedronPoints", value: "Point3F" },
    { count: "U32", key: "polyHedronPlanes", value: "PlaneF" },
    { count: "U32", key: "polyHedronEdges", value: "PolyHedronEdge" },
    { key: "offset", value: "Point3F" }];
    d.structs.PolyHedronEdge = d.structFromString("U32 face0;U32 face1;U32 vertex0;U32 vertex1");
    d.structs.InteriorPathFollower = [{ key: "name", value: "String" },
    { key: "datablock", value: "String" },
    { key: "interiorResIndex", value: "U32" },
    { key: "dict", value: "Dictionary" },
    { count: "U32", key: "triggerIds", value: "U32" },
    { count: "U32", key: "wayPoints", value: "WayPoint" },
    { key: "totalMS", value: "U32" }];
    d.structs.Dictionary = [{ count: "U32", key: "entries", value: "DictEntry" }];
    d.structs.DictEntry = d.structFromString("String name;String value");
    d.structs.WayPoint = d.structFromString("Point3F pos;QuatF rot;U32 msToNext;U32 smoothingType");
    d.structs.ForceField = d.structFromString("U32 version;String name").concat({ count: "U32", key: "triggers", value: "String" }).concat(d.structFromString("Box3F boundingBox;SphereF boundingSphere").concat({ count: "U32", key: "normals", value: "Point3F" }, { count: "U32", key: "planes", value: "Plane" }, { count: "U32", key: "BSPNodes", value: "BSPNode" }, { count: "U32", key: "BSPSolidLeaves", value: "BSPSolidLeaf" }, { count: "U32", key: "windings", value: "U32" }, { count: "Uint32", value: "Surface", key: "surfaces" }, { count: "Uint32", value: "Uint32", key: "solidLeafSurfaces" }, { value: "Color", key: "colorI" }));

    d.structs.AISpecialNode = d.structFromString("String name;Point3F position");
    d.structs.VehicleCollision = d.structFromString("U32 version;U32 VehicleConvexHull vehicleConvexHulls;U32 U8 vehicleConvexHullEmitStrings;U32 U32 vehicleHullIndices;U32 U16 vehicleHullPlaneIndices;U32 U32 vehicleHullEmitStringIndices;U32 U32 vehicleHullSurfaceIndices;U32 U16 vehiclePolyListPlanes;U32 U32 vehiclePolyListPoints;U32 U8 vehiclePolyListStrings;U32 NullSurface vehicleNullSurfaces");
    d.structs.VehicleConvexHull = d.structFromString("U32 hullStart; U16 hullCount; F32 minX; F32 maxX; F32 minY; F32 maxY; F32 minZ; F32 maxZ; U32 surfaceStart; U16 surfaceCount; U32 planeStart; U32 polyListPlaneStart; U32 polyListPointStart; U32 polyListStringStart");
    d.structs.GameEntities = d.structFromString("U32 ItrGameEntity entities");
    d.structs.ItrGameEntity = d.structFromString("String datablock; String gameClass; Point3F position; Dictionary properties");


    d.structs.Interior = [
        { value: "Uint32", key: "interiorFileVersion" },
        { value: "Uint32", key: "detailLevel" },
        { value: "Uint32", key: "minPixels" },
        { value: "BoxF", key: "boundingBox" },
        { value: "SphereF", key: "boundingSphere" },
        { value: "Bool", key: "hasAlarmState" },
        { value: "Uint32", key: "numLightStateEntries" },
        { count: "Uint32", value: "Point3F", key: "normals" },
        { count: "Uint32", value: "Plane", key: "planes" },
        { count: "Uint32", value: "Point3F", key: "points" },
        { count: "Uint32", value: "Uint8", key: "pointVisibilities" },
        { count: "Uint32", value: "TexGenEQ", key: "texGenEqs" },
        { count: "Uint32", value: "BSPNode", key: "BSPNodes" },
        { count: "Uint32", value: "BSPSolidLeaf", key: "BSPSolidLeaves" },
        { value: "MaterialList", key: "materials" },
        { count: "Uint32", value: "Uint32", key: "windings" },
        //{ count: "Uint32", value: "WindingIndex", key: "windingIndices" }, 
        { count: "Uint32", value: "Edge", key: "edges" },
        { count: "Uint32", value: "Zone", key: "zones" },
        { count: "Uint32", value: "Uint16", key: "zoneSurfaces" },
        { count: "Uint32", value: "Uint16", key: "zonePortalList" },
        { count: "Uint32", value: "Portal", key: "portals" },
        { count: "Uint32", value: "Surface", key: "surfaces" },
        //{ count: "Uint32", value: "Uint32", key: "normalLMapIndices", breakpoint: true },
        { count: "Uint32", value: "Uint8", key: "normalLMapIndices" },
        //{ count: "Uint32", value: "Uint32", key: "alarmLMapIndices" },
        { count: "Uint32", value: "Uint8", key: "alarmLMapIndices" },
        { count: "Uint32", value: "NullSurface", key: "nullSurfaces" },
        { count: "Uint32", value: "LightMap", key: "lightMaps" },
        { count: "Uint32", value: "Uint32", key: "solidLeafSurfaces" },
        { count: "Uint32", value: "AnimatedLight", key: "animatedLights" },
        { count: "Uint32", value: "LightState", key: "lightStates" },
        { count: "Uint32", value: "StateData", key: "stateData" },
        //
        { value: "U32", key: "numStateDataBuffers" },
        { count: "Uint32", value: "BSPSolidLeaf", key: "BSPSolidLeaves" },
        { count: "Uint32", value: "S8", key: "nameBuffers" },
        { count: "Uint32", value: "InteriorSubObject", key: "subObjects" },

        //{ value: "U32", key: "flags" },
        //{ rcount: "numStateDataBuffers", value: "U8", key: "sateDataBuffers" },

        { count: "Uint32", value: "ConvexHull", key: "convexHulls", breakpoint: true },
        { count: "Uint32", value: "U8", key: "convexHullEmitStrings" },
        { count: "Uint32", value: "U32", key: "hullIndices" },
        { count: "Uint32", value: "U16", key: "hullPlaneIndices" },
        { count: "Uint32", value: "U32", key: "hullEmitStringIndices" },
        { count: "Uint32", value: "U32", key: "hullSurfaceIndices" },
        { count: "Uint32", value: "U16", key: "polyListPlanes" },
        { count: "Uint32", value: "U32", key: "polyListPoints" },
        { count: "Uint32", value: "U8", key: "polyListStrings" },
        { ncount: 16 * 16, value: "CoordBin", key: "coordBins" },
        { count: "Uint32", value: "U16", key: "coordBinIndices" },
        { value: "U32", key: "coordBinMode" },
        { value: "ColorF", key: "baseAmbientColor" },
        { value: "ColorF", key: "alarmAmbientColor" },
        { count: "Uint32", value: "ConstructorSimpleMesh", key: "staticMeshes" },
        { count: "Uint32", value: "Point3F", key: "normals" },
        { count: "Uint32", value: "TexMatrix", key: "texMatrices" },
        { count: "Uint32", value: "U32", key: "texMatIndices" },
        { count: "Uint32", value: "ExtendedLightMap", key: "extendedLightMapData" },
    ];
    d.structs.MaterialList = [{ value: "Uint8", key: "version" },
    { value: "U32", key: "materialCount", globalName: "materialCount" },
    { rcount: "materialCount", value: "String", key: "materials" }];
    d.structs.WindingIndex = [{ value: "Uint32", key: "windingStart" }, { value: "Uint32", key: "windingCount" }];
    d.structs.Edge = [{ value: "Int32", key: "pointIndex0" },
    { value: "Int32", key: "pointIndex1" },
    { value: "Int32", key: "surfaceIndex0" },
    { value: "Int32", key: "surfaceIndex1" }];
    if (iiver == 0 && false) { //dont know
        d.structs.Edge = [{ value: "Int16", key: "pointIndex0" },
        { value: "Int16", key: "pointIndex1" },
        { value: "Int16", key: "surfaceIndex0" },
        { value: "Int16", key: "surfaceIndex1" }];
    }

    d.structs.Zone = [{ value: "Uint16", key: "portalStart" },
    { value: "Uint16", key: "portalCount" },
    { value: "Uint32", key: "surfaceStart" },
    { value: "Uint16", key: "surfaceCount" },
    { value: "Uint32", key: "staticMeshStart" },
    { value: "Uint32", key: "staticMeshCount" },
    { value: "Uint16", key: "flags" }];

    if (iiver == 0) {
        d.structs.Zone = [{ value: "Uint16", key: "portalStart" },
        { value: "Uint16", key: "portalCount" },
        { value: "Uint32", key: "surfaceStart" },
        { value: "Uint16", key: "surfaceCount" },
        //{ value: "Uint32", key: "staticMeshStart" },
        //{ value: "Uint32", key: "staticMeshCount" },
        { value: "Uint16", key: "flags" }];
    }

    d.structs.Portal = [{ value: "Uint16", key: "planeIndex" },
    { value: "Uint16", key: "triFanCount" },
    { value: "Uint32", key: "triFanStart" },
    { value: "Uint16", key: "zoneFront" },
    { value: "Uint16", key: "zoneBack" }];
    d.structs.Surface = [{ value: "Uint32", key: "windingStart" },
    { value: "Uint32", key: "windingCount" },
    { value: "Uint16", key: "planeIndex" },
    { value: "Uint16", key: "textureIndex" },
    { value: "Uint32", key: "texGenIndex" },
    { value: "Uint8", key: "surfaceFlags" },
    { value: "Uint32", key: "fanMask" },
    { value: "LightMapTexGen", key: "lightMapTexGen" },
    { value: "Uint16", key: "lightCount" },
    { value: "Uint32", key: "lightStateInfoStart" },
    { value: "Uint32", key: "mapOffsetX" },
    { value: "Uint32", key: "mapOffsetY" },
    { value: "Uint32", key: "mapSizeX" },
    { value: "Uint32", key: "mapSizeY" },
    { value: "Bool", key: "unused" }];
    if (iiver == 0) {
        //38 bytes long, not 54
        d.structs.Surface = [{ value: "Uint16", key: "windingStart" },
        { value: "Uint16", key: "windingCount" },
        { value: "Uint16", key: "planeIndex" },
        { value: "Uint16", key: "textureIndex" },
        { value: "Uint16", key: "texGenIndex" },
        { value: "Uint8", key: "surfaceFlags" },
        { value: "Uint32", key: "fanMask" },
        { value: "LightMapTexGen", key: "lightMapTexGen" },
        { value: "Uint16", key: "lightCount" },
        { value: "Uint16", key: "lightStateInfoStart" },
        { value: "Uint16", key: "mapOffsetX" },
        { value: "Uint16", key: "mapOffsetY" },
        { value: "Uint16", key: "mapSizeX" },
        { value: "Uint16", key: "mapSizeY" },
        { value: "Bool", key: "unused" }];

    }
    d.structs.LightMapTexGen = [{ value: "Uint16", key: "finalWord" },
    { value: "Float32", key: "texGenXDistance" },
    { value: "Float32", key: "texGenYDistance" }];
    d.structs.NullSurface = [{ value: "Uint32", key: "windingStart" },
    { value: "Uint16", key: "planeIndex" },
    { value: "Uint8", key: "surfaceFlags" },
    { value: "Uint32", key: "windingCount" }];
    d.structs.LightMap = [{ value: "PNG", key: "lightMap" },
    { value: "PNG", key: "lightDirMap" },
    { value: "Bool", key: "keepLightMap" }];
    d.structs.AnimatedLight = d.structFromString("U32 nameIndex;U32 stateIndex;U16 stateCount;U16 flags;U32 duration");
    d.structs.LightState = d.structFromString("U8 red;U8 green;U8 blue;U32 activeTime;U32 dataIndex;U16 dataCount ");
    d.structs.StateData = d.structFromString("U32 surfaceIndex; U32 mapIndex; U16 lightStateIndex");
    d.structs.ConvexHull = d.structFromString("U32 hullStart; U16 hullCount; F32 minX; F32 maxX; F32 minY; F32 maxY; F32 minZ; F32 maxZ; U32 surfaceStart; U16 surfaceCount; U32 planeStart; U32 polyListPlaneStart; U32 polyListPointStart; U32 polyListStringStart; bool staticMesh");//should be 52 bytes
    d.structs.CoordBin = d.structFromString("U32 binStart;U32 binCount");
    d.structs.ColorF = d.structFromString("F32 red;F32 green;F32 blue;F32 alpha");
    d.structs.Color = d.structFromString("U8 red;U8 green;U8 blue;U8 alpha");
    d.structs.ConstructorSimpleMesh = [{ count: "U32", value: "Primitive", key: "primitives" },
    { count: "U32", value: "U16", key: "indices" },
    { count: "U32", value: "Point3F", key: "vertices" },
    { count: "U32", value: "Point3F", key: "normals" },
    { count: "U32", value: "Point2F", key: "diffuseUVs" },
    { count: "U32", value: "Point2F", key: "lightmapUVs" },
    { count: "bool", value: "TSMaterialList", key: "materialList" },
    { count: "U32", value: "DiffuseBitmap", key: "diffuseBitmaps" },
    { value: "bool", key: "hasSolid" },
    { value: "bool", key: "hasTranslucency" },
    { value: "Box3F", key: "bounds" },
    { value: "MatrixF", key: "transform" },
    { value: "Point3F", key: "scale" }];
    d.structs.TexMatrix = d.structFromString("S32 T;S32 N;S32 B;");
    d.structs.ExtendedLightMap = d.structFromString("U32 lightMapBorderSize;U32 dummy");
    d.structs.Primitive = d.structFromString("bool alpha; U32 texS; U32 texT; S32 diffuseIndex; S32 lightMapIndex; U32 start; U32 count; PlaneF lightMapEquationX; PlaneF lightMapEquationY; Point2I lightMapOffset; Point2I lightMapSize");
    d.structs.DiffuseBitmap = [{ count: "bool", value: "PNG", key: "bitmap" }];





    return d;
}


export {
    Dif
}
