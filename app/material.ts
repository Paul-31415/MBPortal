



type Material = {
    [key: string]: any
    bounceRestitution?: number;
    staticFriction?: number;
    kineticFriction?: number;
    bounceKineticFriction?: number;
};


const defaultMaterial: Material = {
    bounceRestitution: 1,
    staticFriction: 1,
    kineticFriction: 250,
    bounceKineticFriction: 2,

};



export {
    Material, defaultMaterial
}

