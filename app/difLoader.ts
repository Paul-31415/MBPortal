
import * as fs from "fs";
import { Point } from "./3dTypes";
import { DistanceFunction } from "./distanceFunctions";
import { DifFinalizers, Dif } from "./difFinalizers";


/*
  decodes torque .dif files

 spec from:
 http://www.rustycode.com/projects/Docs/Torque%20DIF%20File%20(Interiors)%20-%20Format%2044.14.html


also look at http://docs.garagegames.com/torque-3d/official/content/documentation/Artist%20Guide/Formats/dts_format.html
perhaps
*/
type StructDef = { count?: string, rcount?: string, ncount?: number, gcount?: string, countf?: (d: Dat, r: any, g: any) => number, key: string, value: string | StructDef, post?: (a: any) => any, globalName?: string, breakpoint?: boolean }[];
type Struct = any;
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
    readThing(s: string) {
        let r = this.primitives[s]();
        if (this.debugLog) { console.log(s + " " + r); }
        return r;
    }
    readPNG() {
        return new PNG(this);
    }
    skipBytes(n: number) {
        this.i += n;
    }
    primitives: any = {
        Uint32: this.readUint32.bind(this), Uint16: this.readUint16.bind(this), Uint8: this.readUint8.bind(this),
        Int32: this.readInt32.bind(this), Int16: this.readInt16.bind(this), Int8: this.readInt8.bind(this),
        Float32: this.readFloat32.bind(this), Float64: this.readFloat64.bind(this), Bool: this.readBoolean.bind(this),
        U32: this.readUint32.bind(this), U16: this.readUint16.bind(this), U8: this.readUint8.bind(this),
        S32: this.readInt32.bind(this), S16: this.readInt16.bind(this), S8: this.readInt8.bind(this),
        F32: this.readFloat32.bind(this), F64: this.readFloat64.bind(this), bool: this.readBoolean.bind(this), "null": function(): null { return null; },
        PNG: this.readPNG.bind(this)
    };
    structs: {
        [key: string]: StructDef
    } = {};
    finalizers: { [key: string]: (s: Struct) => any };
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
            if ((t.value as StructDef).push != null) {
                for (let k of this.structDependencies(t.value as StructDef)) {
                    deps[k] = true;
                }
            } else {
                deps[t.value as string] = true;
                if (t.count != null) {
                    deps[t.count] = true;
                }
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
            let sv = s.value as string;
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
                                n = s.countf(this, r, nameSpace);
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
                    if ((s.value as StructDef).push != null) {
                        v[i] = this.readStruct(s.value, null, nameSpace);
                    } else {
                        if (this.primitives[sv] != null) {
                            v[i] = this.readThing(sv);
                        } else {
                            v[i] = this.readStruct(s.value, null, nameSpace);
                        }
                    }
                }
            } else {
                if ((s.value as StructDef).push != null) {
                    this.readStruct(s.value, res, nameSpace);
                } else {
                    if (this.primitives[sv] != null) {
                        tmp = this.readThing(sv);
                    } else {
                        tmp = this.readStruct(s.value, null, nameSpace);
                    }
                }
            }
            if (s.post != null) {
                tmp = s.post(tmp);
            }
            if ((s.value as StructDef).push == null) {
                if (this.finalizers[sv] != null) {
                    tmp = this.finalizers[sv](tmp);
                }
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
    defStructsFromSpec(spec: string): Dat {
        //code structures:

        //<type> <name>

        //for <start> to <end>
        //     <stuff>

        //if (<condition>)
        //     <stuff>

        //<type>
        //     <type definition>

        let stack: { type?: string, count?: (d: Dat, r: any, g: any) => number, countName?: string, indent: number, def: StructDef }[] = [{ type: "file", indent: -1, def: [] }];

        let nextCountf: (d: Dat, r: any, g: any) => number = null;


        let lines = ("\n" + spec).match(/\n( *(?!\/\/)[^\n ]+)+/g);
        for (let i in lines) {
            //cut off newlines
            let line = lines[i].substring(1);
            let indent = line.search(/\S|$/);

            while (stack[stack.length - 1].indent >= indent) {
                let d = stack.pop();
                if (d.type != null) {
                    this.structs[d.type] = d.def;
                } else {
                    if (d.count != null) {
                        stack[stack.length - 1].def.push({ countf: d.count, value: d.def, key: d.countName });
                    }
                }
            }
            //classify line type
            line = line.substring(indent);
            if (line.substring(0, 4) == "if (") {
                //if statement
                let predicate = line.substring(4, line.length - 1);

                let fn: (d: Dat, r: any, g: any) => number;
                //only supports simple (bool) and (var == val) predicates now
                if (predicate.search(/==/) != -1) {
                    let parts = predicate.match(/[^=]+/g);
                    let pvar = parts[0];
                    let pval = parts[1];
                    fn = function(d: Dat, r: any, g: any): number {
                        return (g[pvar] == pval) ? 1 : 0;
                    }
                } else {
                    //direct boolean
                    fn = function(d: Dat, r: any, g: any): number {
                        return (!!g[predicate]) ? 1 : 0;
                    }
                }
                stack.push({ count: fn, indent: indent, def: [] });
            } else {
                if (line.substring(0, 4) == "for ") {
                    //for statement
                    //only for val to var and for ntimes:name supported
                    let terms = line.substring(4, line.length).split(/ to /);
                    let name = "";
                    let fn: (d: Dat, r: any, g: any) => number = null;
                    if (terms.length > 1) {
                        let sval = +terms[0];
                        let tvar = terms[1];
                        fn = function(d: Dat, r: any, g: any): number {
                            return g[tvar] - sval;
                        }
                        //var is expected to be formatted like numThings
                        name = tvar.substring(3, tvar.length);
                    } else {
                        terms = line.substring(4, line.length).split(/:/);
                        let sval = +terms[0];
                        name = terms[1];
                        fn = function(d: Dat, r: any, g: any): number {
                            return sval;
                        }
                    }
                    stack.push({ count: fn, indent: indent, def: [], countName: name });
                } else {
                    if (line.match(/ /) == null) {
                        //type def line
                        // first character is ! if it's not supposed to be implicitly called
                        if (line.substring(0, 1) != "!") {
                            stack[stack.length - 1].def.push({ key: line, value: line, globalName: line });
                        } else {
                            line = line.substring(1, line.length);
                        }
                        stack.push({ type: line, indent: indent, def: [] });
                    } else {
                        //<type> <name> line
                        let l = line.split(/ /);
                        stack[stack.length - 1].def.push({ key: l[1], value: l[0], globalName: l[1] });
                    }
                }
            }
        }
        while (stack.length > 0) {
            let d = stack.pop();
            if (d.type != null) {
                this.structs[d.type] = d.def;
            } else {
                if (d.count != null) {
                    stack[stack.length - 1].def.push({ countf: d.count, value: d.def, key: d.countName });
                }
            }
        }
        return this;
    }
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
function bytes_match(d: Dat, s: number[]) {
    let matched = true;
    for (let b of s) {
        matched = matched && (d.readUint8() == b);
    }
    return matched;
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


class DifReader {
    reader: FileReader;
    constructor(public data: Buffer) { }
    load() {
        this.parse();
        /*
        this.reader.onload = this.parse.bind(this);
        this.reader.readAsBinaryString(this.data);*/
    }
    parse(): Dif {
        let arrayBuffer = this.data.buffer;//this.reader.result;
        console.log(this);
        let d = new Dat(new DataView(arrayBuffer as ArrayBuffer), 0, true).defStructsFromSpec(fs.readFileSync("/Users/paul/Projects/MarbleBlastWithPortals/app/resources/refs/DIF_MB_SPEC\ ascii.txt", 'utf8'));

        d.finalizers = DifFinalizers;


        return new Dif(d.readStruct("file"));

    }
}


export {
    Dif, DifReader
}
