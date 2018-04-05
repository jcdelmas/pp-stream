import { Inlet, SingleInputStage } from './stage';
import { upperFirst } from 'lodash';
import { Graph, materializerFromStageFactory } from './stream';
import { Source } from './source';
export class SinkShape {
    constructor(input) {
        this.input = input;
        this.outputs = [];
        this.inputs = [input];
    }
}
export function _registerSink(name, fn) {
    Source.prototype['run' + upperFirst(name)] = function (...args) {
        return this.runWith(fn(...args));
    };
}
export class SinkStage extends SingleInputStage {
    constructor() {
        super(...arguments);
        this.shape = new SinkShape(new Inlet(this));
    }
    complete() {
        this.cancel();
    }
    error(_) {
        this.cancel();
    }
}
export class SinkStageWithPromise extends SinkStage {
    constructor() {
        super(...arguments);
        this.materializedValue = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    complete() {
        super.complete();
        if (this.resolve) {
            this.resolve(this.result);
        }
    }
    error(e) {
        super.error(e);
        if (this.reject) {
            this.reject(e);
        }
    }
}
export class BasicSinkStage extends SinkStageWithPromise {
    onStart() {
        this.pull();
    }
    onPush() {
        this.onNext(this.grab());
        this.pull();
    }
}
export class Sink extends Graph {
    constructor(materializer, attributes = {}) {
        super(materializer, attributes);
    }
    static fromGraph(factory) {
        return new Sink(factory.materializer, factory.attributes);
    }
    static fromStageFactory(factory) {
        return new Sink(materializerFromStageFactory(factory));
    }
}
//# sourceMappingURL=sink.js.map