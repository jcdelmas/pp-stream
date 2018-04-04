import { Inlet, Outlet, SingleInputStage, SingleOutputStage, Stage } from './stage';
import { Graph, materializerFromGraphFactory, materializerFromStageFactory } from './stream';
import { applyMixins } from '../utils/mixins';
import { Sink, SinkShape } from './sink';
import { Source } from './source';
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
    constructor(materializer) {
        super(materializer);
    }
    static create(factory) {
        return new Flow(materializerFromGraphFactory(factory));
    }
    static fromStageFactory(factory) {
        return new Flow(materializerFromStageFactory(factory));
    }
    pipe(flow) {
        return Flow.create(b => {
            const prev = b.add(this);
            const next = b.add(flow);
            prev.output.wire(next.input);
            return new FlowShape(prev.input, next.output);
        });
    }
    to(sink) {
        return Sink.create(b => {
            const prev = b.add(this);
            const next = b.add(sink);
            prev.output.wire(next.input);
            return new SinkShape(prev.input);
        });
    }
}
//# sourceMappingURL=flow.js.map