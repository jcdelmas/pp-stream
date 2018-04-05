import Buffer from './buffer';
import { Outlet, SingleOutputStage } from './stage';
import { Graph, materializerFromStageFactory } from './stream';
import { ClosedShape, RunnableGraph } from './runnable';
import { Sink } from './sink';
import { keepLeft, keepRight } from './keep';
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
    constructor(materializer, attributes = {}) {
        super(materializer, attributes);
    }
    static fromGraph(factory) {
        return new Source(factory.materializer, factory.attributes);
    }
    static fromStageFactory(factory) {
        return new Source(materializerFromStageFactory(factory));
    }
    pipe(flow) {
        return this.pipeMat(flow, keepLeft);
    }
    pipeMat(flow, combine) {
        return Source.fromGraph(Graph.createWithMat2(this, flow, combine, (_, prev, next) => {
            prev.output.wire(next.input);
            return new SourceShape(next.output);
        }));
    }
    to(sink) {
        return this.toMat(sink, keepLeft);
    }
    toMat(sink, combine) {
        return RunnableGraph.fromGraph(Graph.createWithMat2(this, sink, combine, (_, prev, next) => {
            prev.output.wire(next.input);
            return ClosedShape.instance;
        }));
    }
    runWith(sink) {
        return this.toMat(sink, keepRight).run();
    }
    runWithLastStage(sinkStage) {
        return this.runWith(Sink.fromStageFactory(() => sinkStage));
    }
}
//# sourceMappingURL=source.js.map