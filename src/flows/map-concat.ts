import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function mapConcat<I, O>(fn: (x: I) => O[]): Flow<I, O> {
  return flow(() => new MapConcat<I, O>(fn))
}

declare module '../core/source' {
  interface Source<O> {
    mapConcat<O2>(fn: (x: O) => O2[]): Source<O2>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    mapConcat<O2>(fn: (x: O) => O2[]): Flow<I, O2>
  }
}

_registerFlow('mapConcat', mapConcat)

export class MapConcat<I, O> extends FlowStage<I, O> {
  constructor(private readonly fn: (x: I) => O[]) {
    super()
  }

  index: number = 0;

  current?: O[];

  onPush(): void {
    this.current = this.fn(this.grab());
    this._pushNextOrPull();
  }

  onPull(): void {
    this._pushNextOrPull();
  }

  onComplete(): void {
    if (!this.current) {
      this.complete();
    }
  }

  _pushNextOrPull(): void {
    if (this.current) {
      this.push(this.current[this.index++]);
      if (this.index >= this.current.length) {
        this.current = undefined;
        this.index = 0;
      }
    } else if (!this.shape.input.isClosed()) {
      this.pull();
    } else {
      this.complete();
    }
  }
}
