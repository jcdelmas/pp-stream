import { Inlet, SingleInputStage } from './stage';
import { upperFirst } from 'lodash';
import { Graph, materializerFromGraphFactory, materializerFromStageFactory } from './stream';
import { Source } from './source';
export class SinkShape {
    constructor(input) {
        this.input = input;
        this.outputs = [];
        this.inputs = [input];
    }
}
export function _registerSink(name, fn) {
    Sink[name] = fn;
    Source.prototype['run' + upperFirst(name)] = function () {
        return this.runWith(fn());
    };
}
export class SinkStage extends SingleInputStage {
    constructor() {
        super();
        this.shape = new SinkShape(new Inlet(this));
        this.result = undefined;
        this.materializedValue = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    complete() {
        this.cancel();
        if (this.resolve) {
            this.resolve(this.result);
        }
    }
    error(e) {
        this.cancel();
        if (this.reject) {
            this.reject(e);
        }
    }
}
export class BasicSinkStage extends SinkStage {
    onStart() {
        this.pull();
    }
    onPush() {
        this.onNext(this.grab());
        this.pull();
    }
}
export class Sink extends Graph {
    constructor(materializer) {
        super(materializer);
    }
    static create(factory) {
        return new Sink(materializerFromGraphFactory(factory));
    }
    static fromStageFactory(factory) {
        return new Sink(materializerFromStageFactory(factory));
    }
}
//# sourceMappingURL=sink.js.map