import { isUndefined } from 'lodash'
import GraphInstance from './graph-instance'
import { some } from 'lodash'

export interface Startable {
  start(): void
}

export class Inlet<A> {

  private _wire?: Wire<A>
  _downstreamHandler: DownstreamHandler

  /**
   * @param downstreamHandler
   */
  constructor(downstreamHandler?: DownstreamHandler) {
    this._downstreamHandler = downstreamHandler;
  }

  _setDownstreamHandler(downstreamHandler: DownstreamHandler) {
    if (this._downstreamHandler) {
      throw new Error('Already have downstream handler!')
    }
    this._downstreamHandler = downstreamHandler
  }

  _setWire(wire: Wire<A>): void {
    if (this._wire) {
      throw new Error('Already wired!');
    }
    this._wire = wire;
  }

  isReady(): boolean {
    return !!this._wire;
  }

  isAvailable(): boolean {
    if (!this._wire) {
      throw new Error('Not ready!');
    }
    return this._wire.hasPendingElement
  }

  hasBeenPulled(): boolean {
    if (!this._wire) {
      throw new Error('Not ready!');
    }
    return this._wire.hasBeenPulled;
  }

  isClosed(): boolean {
    if (!this._wire) {
      throw new Error('Not ready!');
    }
    return this._wire.closed || this._wire.canceled;
  }

  canBePulled(): boolean {
    return !this.hasBeenPulled() && !this.isClosed();
  }

  grab(): A {
    if (!this._wire) {
      throw new Error('Not ready!');
    }
    return this._wire.grab();
  }

  pull(): void {
    if (!this._wire) {
      throw new Error('Not ready!');
    }
    this._wire.pull();
  }

  pullIfAllowed(): void {
    if (this.canBePulled()) {
      this.pull();
    }
  }

  cancel(): void {
    if (!this._wire) {
      throw new Error('Not ready!');
    }
    this._wire.cancel();
  }
}

export class Outlet<A> {

  private _wire?: Wire<A>
  _upstreamHandler: UpstreamHandler

  constructor(upstreamHandler?: UpstreamHandler) {
    this._upstreamHandler = upstreamHandler;
  }

  _setUpstreamHandler(upstreamHandler: UpstreamHandler) {
    if (this._upstreamHandler) {
      throw new Error('Already have upstream handler!')
    }
    this._upstreamHandler = upstreamHandler
  }

  wire(inlet: Inlet<A>) {
    if (this._wire) {
      throw new Error('Already wired!')
    }
    if (!this._upstreamHandler) {
      throw new Error('No upstream handler!')
    }
    if (!inlet._downstreamHandler) {
      throw new Error('No downstream handler!')
    }
    this._wire = new Wire(this._upstreamHandler, inlet._downstreamHandler)
    inlet._setWire(this._wire)
  }

  isReady(): boolean {
    return !!this._wire;
  }

  isAvailable(): boolean {
    if (!this._wire) {
      throw new Error('Not ready!')
    }
    return this._wire.waitingForPush;
  }

  isClosed(): boolean {
    if (!this._wire) {
      throw new Error('Not ready!')
    }
    return this._wire.closed || this._wire.completed;
  }

  push(x: A): void {
    if (!this._wire) {
      throw new Error('Not ready!')
    }
    this._wire.push(x);
  }

  pushAndComplete(x: A): void {
    this.push(x)
    this.complete()
  }

  error(e: any): void {
    if (!this._wire) {
      throw new Error('Not ready!')
    }
    this._wire.error(e);
  }

  complete(): void {
    if (!this._wire) {
      throw new Error('Not ready!')
    }
    this._wire.complete();
  }
}

export interface Shape {
  readonly inputs: Inlet<any>[]
  readonly outputs: Outlet<any>[]
}

class Wire<A> {

  private _downstreamHandler: DownstreamHandler
  private _upstreamHandler: UpstreamHandler

  constructor(upstreamHandler: UpstreamHandler, downstreamHandler: DownstreamHandler) {
    this._upstreamHandler = upstreamHandler;
    this._downstreamHandler = downstreamHandler;
  }

  waitingForPush: boolean = false;
  hasBeenPulled: boolean = false;

  completed: boolean = false;
  canceled: boolean = false;
  closed: boolean = false;

  _pendingElement?: A

  _asyncRequired: boolean = false;

  get hasPendingElement(): boolean {
    return !isUndefined(this._pendingElement)
  }

  grab(): A {
    if (isUndefined(this._pendingElement)) {
      throw new Error('No element available');
    }
    const el = this._pendingElement;
    this._resetElement();
    return el;
  }

  pull(): void {
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

  cancel(): void {
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

  push(x: A): void {
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
      this._downstreamHandler.onPush()
    });
  }

  error(e: any): void {
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

  complete(): void {
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

  _resetElement(): void {
    this._pendingElement = undefined
  }

  _asyncIfRequired(cb: () => void): void {
    if (this._asyncRequired) {
      setImmediate(() => {
        try {
          cb()
        } catch (e) {
          this.error(e);
        }
      });
    } else {
      this._asyncRequired = true;
      try {
        try {
          cb()
        } catch (e) {
          this.error(e);
        }
      } finally {
        this._asyncRequired = false;
      }
    }
  }
}

/**
 * @interface
 */
export interface DownstreamHandler {
  onPush(): void
  onError(e: any): void
  onComplete(): void
}

export interface UpstreamHandler {
  onPull(): void
  onCancel(): void
}

export abstract class Stage<S extends Shape, R> implements GraphInstance<S, R> {

  abstract readonly shape: S
  abstract readonly resultValue: R

  // Lifecycle methods

  onStart(): void {
  }

  onStop(): void {
  }

  // General command methods

  start(): void {
    if (some(this.shape.inputs, i => !i.isReady())) {
      throw new Error('Not wired input');
    }
    if (some(this.shape.outputs, o => !o.isReady())) {
      throw new Error('Not wired input');
    }
    this.onStart();
  }
}

export abstract class SingleInputStage<I, S extends { input: Inlet<I> } & Shape, R> extends Stage<S, R> implements DownstreamHandler {

  // Downstream handler methods

  abstract onPush(): void

  abstract onError(e: any): void

  abstract onComplete(): void

  // Single input command methods

  grab(): I {
    return this.shape.input.grab()
  }

  pull(): void {
    this.shape.input.pull()
  }

  pullIfAllowed(): void {
    this.shape.input.pullIfAllowed()
  }

  cancel(): void {
    this.shape.input.cancel()
  }

  // Single input query methods

  isInputAvailable(): boolean {
    return this.shape.input.isAvailable();
  }

  isInputClosed(): boolean {
    return this.shape.input.isClosed();
  }

  isInputHasBeenPulled(): boolean {
    return this.shape.input.hasBeenPulled();
  }

  isInputCanBePulled(): boolean {
    return this.shape.input.canBePulled();
  }
}

export abstract class SingleOutputStage<O, S extends { output: Outlet<O> } & Shape> extends Stage<S, void> implements UpstreamHandler {

  resultValue: void = undefined

  abstract onPull(): void

  abstract onCancel(): void

  // Single output command methods

  push(x: O): void {
    this.shape.output.push(x)
  }

  pushAndComplete(x: O): void {
    this.shape.output.pushAndComplete(x)
  }

  complete(): void {
    this.shape.output.complete()
  }

  error(e: any): void {
    this.shape.output.error(e)
  }

  // Single output query methods

  isOutputAvailable(): boolean {
    return this.shape.output.isAvailable();
  }

  isOutputClosed(): boolean {
    return this.shape.output.isClosed();
  }
}
