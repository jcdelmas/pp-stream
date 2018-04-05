import { Graph } from './stream';
export class ClosedShape {
    constructor() {
        this.inputs = [];
        this.outputs = [];
    }
}
ClosedShape.instance = new ClosedShape;
export class RunnableGraph extends Graph {
    constructor(materializer, attributes = {}) {
        super(materializer, attributes);
    }
    static fromGraph(factory) {
        return new RunnableGraph(factory.materializer, factory.attributes);
    }
    run() {
        const module = this.materialize();
        module.start();
        return module.materializedValue;
    }
}
//# sourceMappingURL=runnable.js.map