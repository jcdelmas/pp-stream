import { Inlet, Outlet, SingleInputStage, SingleOutputStage, Stage } from './stage';
import { Graph, materializerFromStageFactory } from './stream';
import { applyMixins } from '../utils/mixins';
import { Sink, SinkShape } from './sink';
import { Source } from './source';
import { keepLeft } from './keep';
export class FlowShape {
    constructor(input, output) {
        this.input = input;
        this.output = output;
        this.inputs = [input];
        this.outputs = [output];
    }
}
export function _registerFlow(name, fn) {
    Source.prototype[name] = function (...args) {
        return this.pipe(fn(...args));
    };
    Flow.prototype[name] = function (...args) {
        return this.pipe(fn(...args));
    };
}
export class FlowStage extends Stage {
    constructor() {
        super();
        this.shape = new FlowShape(new Inlet(this), new Outlet(this));
    }
    onPull() {
        this.pullIfAllowed();
    }
}
applyMixins(FlowStage, [SingleInputStage, SingleOutputStage]);
export class Flow extends Graph {
    constructor(materializer, attributes = {}) {
        super(materializer, attributes);
    }
    static fromGraph(factory) {
        return new Flow(factory.materializer, factory.attributes);
    }
    static fromStageFactory(factory) {
        return new Flow(materializerFromStageFactory(factory));
    }
    pipe(flow) {
        return this.pipeMat(flow, keepLeft);
    }
    pipeMat(flow, combine) {
        return Flow.fromGraph(Graph.createWithMat2(this, flow, combine, (_, prev, next) => {
            prev.output.wire(next.input);
            return new FlowShape(prev.input, next.output);
        }));
    }
    to(sink) {
        return this.toMat(sink, keepLeft);
    }
    toMat(sink, combine) {
        return Sink.fromGraph(Graph.createWithMat2(this, sink, combine, (_, prev, next) => {
            prev.output.wire(next.input);
            return new SinkShape(prev.input);
        }));
    }
}
//# sourceMappingURL=flow.js.map