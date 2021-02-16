
import * as THREE from "three";
import * as fs from "fs";
import { Point, Quaternion, Color } from "./3dTypes";


type Attributes = {
    [key: string]: { val: string, props?: Attributes }
};


interface SimGroupMember {
    type: string,
    editorName: string,
    attributes?: Attributes,
    contents?: SimGroupMember[]
}

interface MissionObject extends SimGroupMember {
    loadObject(onLoad: (o: THREE.Object3D) => void): void,
    object: THREE.Object3D,
    loaded: boolean
}

class SimGroup implements SimGroupMember {
    type = "SimGroup";
    constructor(public editorName: string, contents: SimGroupMember[]) { }
}



function parseNumList(s: string): number[] {
    const ns = s.match(/[^ ]+/g);
    const r: number[] = [];
    for (let i in ns) {
        r[i] = +ns[i];
    }
    return r;
}
function parseNumber(s: string): number {
    return +s;
}
function parseBool(s: string): boolean {
    return !!s;
}
function parsePoint(s: string): Point {
    return new Point(...parseNumList(s));
}
function parseColor(s: string): Color {
    return new Color(...parseNumList(s));
}
function parseQuaternion(s: string): Quaternion {
    let l = parseNumList(s);
    return new Quaternion(l[0], l[1], l[2], l[3]);
}


class Sun implements MissionObject {
    type = "Sun";
    direction: Point;
    color: Color;
    ambient: Color;
    position: Point;
    rotation: Quaternion;
    scale: Point;
    locked: boolean;
    constructor(public editorName: string, attributes: Attributes) {
        this.direction = parsePoint(attributes.direction.val);
        this.color = parseColor(attributes.color.val);
        this.ambient = parseColor(attributes.ambient.val);
        this.position = parsePoint(attributes.position.val);
        this.rotation = parseQuaternion(attributes.rotation.val);
        this.scale = parsePoint(attributes.scale.val);
        this.locked = parseBool(attributes.locked.val);
    }
    object: THREE.Object3D;
    loaded: boolean;
    loadObject(onLoad: (o: THREE.Object3D) => void) {
        let d = new THREE.DirectionalLight(this.color.v, this.color.a);
        let a = new THREE.AmbientLight(this.ambient.v, this.ambient.a);
        this.direction.setXYZof(d.position);
        d.children.push(a);
        this.object = d;
        this.loaded = true;
        onLoad(d);
    }
}

class InteriorInstance implements MissionObject {
    type = "InteriorInstance";
    interiorFile: string;
    position: Point;
    rotation: Quaternion;
    scale: Point;
    showTerrainInside: number;
    locked: boolean;
    constructor(public editorName: string, attributes: Attributes) {
        this.interiorFile = attributes.interiorFile.val;
        this.position = parsePoint(attributes.position.val);
        this.rotation = parseQuaternion(attributes.rotation.val);
        this.scale = parsePoint(attributes.scale.val);
        this.showTerrainInside = parseNumber(attributes.showTerrainInside.val);
        this.locked = parseBool(attributes.locked.val);
    }
    object: THREE.Object3D;
    loaded: boolean;
    loadObject(onLoad: (o: THREE.Object3D) => void) {
        (function l(o: THREE.Object3D) {
            this.object = o;
            this.loaded = true;
            onLoad(o);
        }).bind(this);



    }
}






type parenTree = { leaf?: string[], children?: parenTree }[];

class MisLoader {
    constructor(public path: string = "resources/data/missions/movement") { }
    loaded = false;

    load() {
        let image = this.path + '.jpg';
        let msn = this.path + '.mis';
        var readStream = fs.createReadStream(msn, { encoding: 'utf8' });
        readStream.on("data", this.parse.bind(this)).on('end', function() { this.finish(); }.bind(this));

    }
    code: string = "";
    parse(chunk: string) {
        this.code += chunk;
    }
    finish() {
        //https://stackoverflow.com/questions/9609973/javascript-method-to-split-string-on-unquoted-comma
        let preKet = this.code.match(/(?:"(?:\\.|[^"])*"|[^{])+/g);
        let prePostKet: string[][] = [];
        for (let l in preKet) {
            prePostKet[l] = preKet[l].match(/(?:"(?:\\.|[^"])*"|[^}])+/g);
        }

        //balance parentheses

        let objectTree: parenTree = [];
        let stack: parenTree[] = [objectTree];
        let f = true;
        for (let l in prePostKet) {
            if (f) {
                f = false;
            } else {
                let c: parenTree = [{ children: [] }];
                stack[stack.length - 1].push(c[0]);
                stack.push(c[0].children);
            }

            let t = true;
            for (let m in prePostKet[l]) {

                //this activates every unquote + 1 times
                if (t) {
                    t = false;//skip first
                } else {
                    stack.pop();
                }

                stack[stack.length - 1].push({ leaf: prePostKet[l][m].match(/(?:"(?:\\.|[^"])*"|[^;])+/g) });

                //add leafs to stack top
            }
        }

        //now parse each "line"

        this.mission = this.parseTree(objectTree);
        this.loaded = true;
    }

    mission: SimGroupMember;
    parseTree(t: parenTree): SimGroupMember {
        return this.parseRecursively(t, { type: "Mission", editorName: "" })
    }
    parseRecursively(t: parenTree, parent: SimGroupMember): SimGroupMember {
        let nextParent: SimGroupMember = null;
        for (let c of t) {
            //chunk
            if (c.leaf != null) {
                //parse assignments

                for (let l of c.leaf) {
                    if (l.match(/=/) != null) {
                        //assignment
                        parent.attributes[l.match(/(\w+)(?=\s+=)/)[0]] =
                            { val: l.match(/(?:=\s+)(?:"((?:\\.|[^"])*)")/)[1] };
                    } else {
                        //new blank(name)
                        let m = l.match(/\s+new\s+(\w+)\((\w*)\)/);
                        if (m != null) {
                            nextParent = { type: m[1], editorName: m[2] };
                        }
                    }
                }
            }
            if (c.children != null) {
                if (parent.contents == null) {
                    parent.contents = [];
                }
                parent.contents.push(this.parseRecursively(c.children, nextParent));
            }
        }
        return parent;
    }

}
