import Buffer from './buffer';
import { Outlet, SingleOutputStage } from './stage';
import { materializerFromGraphFactory, Graph, materializerFromStageFactory } from './stream';
import { ClosedShape, RunnableGraph } from './runnable';
import { Sink } from './sink';
class SourceShape {
    constructor(output) {
        this.output = output;
        this.inputs = [];
        this.outputs = [output];
    }
}
export class SourceStage extends SingleOutputStage {
    constructor() {
        super(...arguments);
        this.shape = new SourceShape(new Outlet(this));
    }
}
export class PushSourceStage extends SourceStage {
    constructor(props) {
        super();
        this.completePending = false;
        this.buffer = new Buffer(props.bufferSize, props.bufferOverflowStrategy);
    }
    push(x) {
        if (this.isOutputAvailable()) {
            super.push(x);
        }
        else {
            this.buffer.push(x);
        }
    }
    onPull() {
        if (!this.buffer.isEmpty()) {
            super.push(this.buffer.pull());
            if (this.completePending && this.buffer.isEmpty()) {
                super.complete();
            }
        }
    }
    complete() {
        if (this.buffer.isEmpty()) {
            super.complete();
        }
        else {
            this.completePending = true;
        }
    }
}
export class Source extends Graph {
    constructor(materializer) {
        super(materializer);
    }
    static create(factory) {
        return new Source(materializerFromGraphFactory(factory));
    }
    static fromStageFactory(factory) {
        return new Source(materializerFromStageFactory(factory));
    }
    pipe(flow) {
        return Source.create(b => {
            const prev = b.add(this);
            const next = b.add(flow);
            prev.output.wire(next.input);
            return new SourceShape(next.output);
        });
    }
    to(sink) {
        return RunnableGraph.create(b => {
            const prev = b.add(this);
            const next = b.add(sink);
            prev.output.wire(next.input);
            return ClosedShape.instance;
        });
    }
    runWith(sink) {
        return this.to(sink.key('_result')).run()._result;
    }
    runWithLastStage(sinkStage) {
        return this.runWith(Sink.fromStageFactory(() => sinkStage));
    }
}
//# sourceMappingURL=source.js.map