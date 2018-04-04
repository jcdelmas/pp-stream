import Module from './module';
export class GraphBuilder {
    constructor() {
        this.submodules = [];
    }
    add(s) {
        const module = s.materialize();
        this.submodules.push(module);
        return module.shape;
    }
}
export function materializerFromGraphFactory(factory) {
    return (attrs) => {
        const builder = new GraphBuilder();
        const shape = factory(builder);
        return Module.create(shape, builder.submodules, attrs);
    };
}
export function materializerFromStageFactory(stageFactory) {
    return (attrs) => {
        const stage = stageFactory();
        return new Module(stage.shape, [stage], attrs.key ? { [attrs.key]: stage.materializedValue } : {});
    };
}
export class Graph {
    constructor(materializer, attributes = {}) {
        this.materializer = materializer;
        this.attributes = attributes;
    }
    materialize() {
        return this.materializer(this.attributes);
    }
    key(name) {
        return this.withAttributes({ key: name });
    }
    withAttributes(attrs) {
        return new Graph(this.materializer, Object.assign({}, this.attributes, attrs));
    }
}
//# sourceMappingURL=stream.js.map