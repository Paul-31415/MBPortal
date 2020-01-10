



type Material = {
    bounceRestitution?: number;
    [key: string]: any
};


const defaultMaterial: Material = {
    bounceRestitution: 1
};



export {
    Material, defaultMaterial
}

