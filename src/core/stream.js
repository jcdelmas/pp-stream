import Module from './module';
export class GraphBuilder {
    constructor() {
        this.submodules = [];
    }
    addModule(s) {
        const module = s.materialize();
        this.submodules.push(module);
        return module;
    }
    _addAndMaterialize(s) {
        const module = this.addModule(s);
        return [module.shape, module.materializedValue];
    }
    add(s) {
        return this.addModule(s).shape;
    }
}
export function materializerFromStageFactory(stageFactory) {
    return (attrs) => {
        const stage = stageFactory();
        return new Module(stage.shape, [stage], attrs, stage.materializedValue);
    };
}
export class Graph {
    constructor(materializer, attributes = {}) {
        this.materializer = materializer;
        this.attributes = attributes;
    }
    static createGraph(factory) {
        return new Graph((attrs) => {
            const builder = new GraphBuilder();
            const [shape, materializedValue] = factory(builder);
            return new Module(shape, builder.submodules, attrs, materializedValue);
        });
    }
    static create(factory) {
        return this.createGraph(b => [factory(b), undefined]);
    }
    static createWithMat(g1, factory) {
        return this.createGraph(builder => {
            const [s, materializedValue] = builder._addAndMaterialize(g1);
            return [factory(builder, s), materializedValue];
        });
    }
    static createWithMat2(g1, g2, f, factory) {
        return this.createGraph(builder => {
            const [s1, m1] = builder._addAndMaterialize(g1);
            const [s2, m2] = builder._addAndMaterialize(g2);
            return [factory(builder, s1, s2), f(m1, m2)];
        });
    }
    materialize() {
        return this.materializer(this.attributes);
    }
    withAttributes(attrs) {
        return new Graph(this.materializer, Object.assign({}, this.attributes, attrs));
    }
}
//# sourceMappingURL=stream.js.map