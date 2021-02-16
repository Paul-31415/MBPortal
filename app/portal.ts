import * as THREE from "three";
import { Point, AffineTransform } from "./3dTypes";




class Portal {

}



class PortalTexture {

    constructor(public transform: AffineTransform) { }





    getCam(c: THREE.PerspectiveCamera): THREE.PerspectiveCamera {
        let r = c.clone();
        let p = new Point();

        r.applyMatrix(this.transform.v);

        return r;
    }


}




export {
    Portal
    , PortalTexture

}





















