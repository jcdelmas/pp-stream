import { isUndefined } from 'lodash'

export interface Startable {
  start(): void
}

export class Inlet<A> {

  private _wire?: Wire<A>
  _downstreamHandler: DownstreamHandler

  /**
   * @param downstreamHandler
   */
  constructor(downstreamHandler: DownstreamHandler) {
    this._downstreamHandler = downstreamHandler;
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

/**
 * @interface
 */
export class Outlet<A> {

  private _wire?: Wire<A>
  _upstreamHandler: UpstreamHandler

  constructor(upstreamHandler: UpstreamHandler) {
    this._upstreamHandler = upstreamHandler;
  }

  wire(inlet: Inlet<A>) {
    if (this._wire) {
      throw new Error('Already wired!')
    }
    this._wire = new Wire(this, inlet)
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

  constructor(outlet: Outlet<A>, inlet: Inlet<A>) {
    this._downstreamHandler = inlet._downstreamHandler;
    this._upstreamHandler = outlet._upstreamHandler;
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

export abstract class Stage<S extends Shape, M> implements Startable {

  materializedValue: M

  abstract shape: S

  // Lifecycle methods

  onStart(): void {
  }

  doFinish(): void {
  }

  // General command methods

  finish(): void {
    this.cancel();
    this.doFinish();
    this.complete();
  }

  start(): void {
    this.onStart();
  }

  cancel(): void {
    this.shape.inputs.forEach(input => {
      if (!input.isClosed()) {
        input.cancel();
      }
    });
  }

  complete(): void {
    this.shape.outputs.forEach(output => {
      if (!output.isClosed()) {
        output.complete();
      }
    });
  }

  error(e: any): void {
    this.shape.outputs.forEach(output => {
      if (!output.isClosed()) {
        output.error(e);
      }
    });
  }
}

export abstract class SingleInputStage<I, S extends { input: Inlet<I> } & Shape, M> extends Stage<S, M> implements DownstreamHandler {

  // Downstream handler methods

  abstract onPush(): void

  onError(e: any) {
    this.doFinish()
    this.error(e)
  }

  onComplete(): void {
    this.doFinish()
    this.complete()
  }

  // Single input command methods

  grab(): I {
    return this.shape.input.grab();
  }

  pull(): void {
    this.shape.input.pull();
  }

  pullIfAllowed(): void {
    this.shape.input.pullIfAllowed();
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

export abstract class SingleOutputStage<O, S extends { output: Outlet<O> } & Shape, M> extends Stage<S, M> implements UpstreamHandler {

  abstract onPull(): void

  onCancel(): void {
    this.cancel();
    this.doFinish();
  }

  // Single output command methods

  push(x: O): void {
    this.shape.output.push(x);
  }

  pushAndComplete(x: O): void {
    this.push(x);
    this.complete();
  }

  // Single output query methods

  isOutputAvailable(): boolean {
    return this.shape.output.isAvailable();
  }

  isOutputClosed(): boolean {
    return this.shape.output.isClosed();
  }
}
