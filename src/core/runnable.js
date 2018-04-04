import { Graph, materializerFromGraphFactory } from './stream';
export class ClosedShape {
    constructor() {
        this.inputs = [];
        this.outputs = [];
    }
}
ClosedShape.instance = new ClosedShape;
export class RunnableGraph extends Graph {
    static create(factory) {
        return new RunnableGraph(materializerFromGraphFactory(factory));
    }
    constructor(materializer) {
        super(materializer);
    }
    run() {
        const module = this.materialize();
        module.start();
        return module.materializedValue;
    }
}
//# sourceMappingURL=runnable.js.map