import { isUndefined } from 'lodash';
export class Inlet {
    /**
     * @param downstreamHandler
     */
    constructor(downstreamHandler) {
        this._downstreamHandler = downstreamHandler;
    }
    _setWire(wire) {
        if (this._wire) {
            throw new Error('Already wired!');
        }
        this._wire = wire;
    }
    isReady() {
        return !!this._wire;
    }
    isAvailable() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        return this._wire.hasPendingElement;
    }
    hasBeenPulled() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        return this._wire.hasBeenPulled;
    }
    isClosed() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        return this._wire.closed || this._wire.canceled;
    }
    canBePulled() {
        return !this.hasBeenPulled() && !this.isClosed();
    }
    grab() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        return this._wire.grab();
    }
    pull() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        this._wire.pull();
    }
    pullIfAllowed() {
        if (this.canBePulled()) {
            this.pull();
        }
    }
    cancel() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        this._wire.cancel();
    }
}
/**
 * @interface
 */
export class Outlet {
    constructor(upstreamHandler) {
        this._upstreamHandler = upstreamHandler;
    }
    wire(inlet) {
        if (this._wire) {
            throw new Error('Already wired!');
        }
        this._wire = new Wire(this, inlet);
        inlet._setWire(this._wire);
    }
    isReady() {
        return !!this._wire;
    }
    isAvailable() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        return this._wire.waitingForPush;
    }
    isClosed() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        return this._wire.closed || this._wire.completed;
    }
    push(x) {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        this._wire.push(x);
    }
    error(e) {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        this._wire.error(e);
    }
    complete() {
        if (!this._wire) {
            throw new Error('Not ready!');
        }
        this._wire.complete();
    }
}
class Wire {
    constructor(outlet, inlet) {
        this.waitingForPush = false;
        this.hasBeenPulled = false;
        this.completed = false;
        this.canceled = false;
        this.closed = false;
        this._asyncRequired = false;
        this._downstreamHandler = inlet._downstreamHandler;
        this._upstreamHandler = outlet._upstreamHandler;
    }
    get hasPendingElement() {
        return !isUndefined(this._pendingElement);
    }
    grab() {
        if (isUndefined(this._pendingElement)) {
            throw new Error('No element available');
        }
        const el = this._pendingElement;
        this._resetElement();
        return el;
    }
    pull() {
        if (this.closed || this.canceled) {
            throw new Error('Input closed');
        }
        if (this.hasBeenPulled) {
            throw new Error('Input already pulled');
        }
        if (this.completed) {
            return;
        }
        if (!isUndefined(this._pendingElement)) {
            this._resetElement();
        }
        this.hasBeenPulled = true;
        this._asyncIfRequired(() => {
            this.waitingForPush = true;
            this._upstreamHandler.onPull();
        });
    }
    cancel() {
        if (this.closed || this.canceled) {
            throw new Error('Input already closed');
        }
        if (this.completed) {
            return;
        }
        this.hasBeenPulled = false;
        this.canceled = true;
        if (!isUndefined(this._pendingElement)) {
            this._resetElement();
        }
        this._asyncIfRequired(() => {
            this.closed = true;
            this.waitingForPush = false;
            this._upstreamHandler.onCancel();
        });
    }
    push(x) {
        if (this.closed || this.completed) {
            throw new Error('Output closed');
        }
        if (!this.waitingForPush) {
            throw new Error('Output not available');
        }
        if (this.canceled) {
            return;
        }
        this.waitingForPush = false;
        this._asyncIfRequired(() => {
            this.hasBeenPulled = false;
            this._pendingElement = x;
            this._downstreamHandler.onPush();
        });
    }
    error(e) {
        this.waitingForPush = false;
        if (this.canceled) {
            return;
        }
        this.waitingForPush = false;
        this._asyncIfRequired(() => {
            this.hasBeenPulled = false;
            this._downstreamHandler.onError(e);
        });
    }
    complete() {
        if (this.completed || this.closed) {
            throw new Error('Output already closed');
        }
        if (this.canceled) {
            return;
        }
        this.waitingForPush = false;
        this.completed = true;
        this._asyncIfRequired(() => {
            this.closed = true;
            this._downstreamHandler.onComplete();
        });
    }
    _resetElement() {
        this._pendingElement = undefined;
    }
    _asyncIfRequired(cb) {
        if (this._asyncRequired) {
            setImmediate(() => {
                try {
                    cb();
                }
                catch (e) {
                    this.error(e);
                }
            });
        }
        else {
            this._asyncRequired = true;
            try {
                try {
                    cb();
                }
                catch (e) {
                    this.error(e);
                }
            }
            finally {
                this._asyncRequired = false;
            }
        }
    }
}
export class Stage {
    // Lifecycle methods
    onStart() {
    }
    doFinish() {
    }
    // General command methods
    finish() {
        this.cancel();
        this.doFinish();
        this.complete();
    }
    start() {
        this.onStart();
    }
    cancel() {
        this.shape.inputs.forEach(input => {
            if (!input.isClosed()) {
                input.cancel();
            }
        });
    }
    complete() {
        this.shape.outputs.forEach(output => {
            if (!output.isClosed()) {
                output.complete();
            }
        });
    }
    error(e) {
        this.shape.outputs.forEach(output => {
            if (!output.isClosed()) {
                output.error(e);
            }
        });
    }
}
export class SingleInputStage extends Stage {
    onError(e) {
        this.doFinish();
        this.error(e);
    }
    onComplete() {
        this.doFinish();
        this.complete();
    }
    // Single input command methods
    grab() {
        return this.shape.input.grab();
    }
    pull() {
        this.shape.input.pull();
    }
    pullIfAllowed() {
        this.shape.input.pullIfAllowed();
    }
    // Single input query methods
    isInputAvailable() {
        return this.shape.input.isAvailable();
    }
    isInputClosed() {
        return this.shape.input.isClosed();
    }
    isInputHasBeenPulled() {
        return this.shape.input.hasBeenPulled();
    }
    isInputCanBePulled() {
        return this.shape.input.canBePulled();
    }
}
export class SingleOutputStage extends Stage {
    onCancel() {
        this.cancel();
        this.doFinish();
    }
    // Single output command methods
    push(x) {
        this.shape.output.push(x);
    }
    pushAndComplete(x) {
        this.push(x);
        this.complete();
    }
    // Single output query methods
    isOutputAvailable() {
        return this.shape.output.isAvailable();
    }
    isOutputClosed() {
        return this.shape.output.isClosed();
    }
}
//# sourceMappingURL=stage.js.map