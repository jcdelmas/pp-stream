import { FanInShape, FanInShape2, FanInShape3, FanInStage } from '../core/fan-in'
import { Inlet, Outlet } from '../core/stage'
import { Flow, FlowShape } from '../core/flow'
import { Graph } from '../core/graph'
import { Source } from '../core/source'
import { complexSource } from '../core/source'
import { complexFlow } from '../core/flow'

export function zip<I1, I2>(): Graph<FanInShape2<I1, I2, [I1, I2]>, void> {
  return new Graph(() => new Zip<I1, I2>())
}

export function zip3<I1, I2, I3>(): Graph<FanInShape3<I1, I2, I3, [I1, I2, I3]>, void> {
  return new Graph(() => new Zip3<I1, I2, I3>())
}

export function zipSources<O1, O2>(s1: Source<O1>, s2: Source<O2>): Source<[O1, O2]> {
  return complexSource(b => {
    const merge = b.add(zip<O1, O2>())
    b.add(s1).output.wire(merge.in1)
    b.add(s2).output.wire(merge.in2)
    return merge.output
  })
}

export function zip3Sources<O1, O2, O3>(s1: Source<O1>, s2: Source<O2>, s3: Source<O3>): Source<[O1, O2, O3]> {
  return complexSource(b => {
    const merge = b.add(zip3<O1, O2, O3>())
    b.add(s1).output.wire(merge.in1)
    b.add(s2).output.wire(merge.in2)
    b.add(s3).output.wire(merge.in3)
    return merge.output
  })
}

declare module '../core/source' {
  interface Source<O> {
    zip<O2>(s: Source<O2>): Source<[O, O2]>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    zip<O2>(s: Source<O2>): Flow<I, [O, O2]>
  }
}

export function zipFlow<I1, I2>(source: Source<I2>): Flow<I1, [I1, I2]> {
  return complexFlow(b => {
    const s = b.add(source)
    const merge = b.add(zip<I1, I2>())
    s.output.wire(merge.in2)
    return new FlowShape(merge.in1, merge.output)
  })
}

Source.prototype.zip = function<I1, I2>(this: Source<I1>, source: Source<I2>) {
  return this.pipe(zipFlow<I1, I2>(source))
}

Flow.prototype.zip = function<I, O1, O2>(this: Flow<I, O1>, source: Source<O2>) {
  return this.pipe(zipFlow<O1, O2>(source))
}

abstract class BaseZip<O, S extends FanInShape<O>> extends FanInStage<O, S> {

  createDownstreamHandler(index: number) {
    return {
      onPush: () => {
        if (this.shape.inputs.every(i => i.isAvailable())) {
          this.push(this.grabOutput())

          if (this.shape.inputs.some(i => i.isClosed())) {
            this.finish();
          }
        }
      },
      onComplete: () => {
        if (!this.isOutputClosed() && !this.shape.inputs[index].isAvailable()) {
          this.finish();
        }
      },
      onError: (e: any) => this.error(e)
    };
  }

  onPull() {
    this.shape.inputs.forEach(i => i.pull());
  }

  abstract grabOutput(): O
}

export class Zip<I1, I2> extends BaseZip<[I1, I2], FanInShape2<I1, I2, [I1, I2]>> {

  shape: FanInShape2<I1, I2, [I1, I2]>

  constructor() {
    super()
    this.shape = new FanInShape2(
      new Inlet<I1>(this.createDownstreamHandler(0)),
      new Inlet<I2>(this.createDownstreamHandler(1)),
      new Outlet<[I1, I2]>(this)
    )
  }

  grabOutput(): [I1, I2] {
    return [this.shape.in1.grab(), this.shape.in2.grab()]
  }
}

export class Zip3<I1, I2, I3> extends BaseZip<[I1, I2, I3], FanInShape3<I1, I2, I3, [I1, I2, I3]>> {

  shape: FanInShape3<I1, I2, I3, [I1, I2, I3]>

  constructor() {
    super()
    this.shape = new FanInShape3(
      new Inlet<I1>(this.createDownstreamHandler(0)),
      new Inlet<I2>(this.createDownstreamHandler(1)),
      new Inlet<I3>(this.createDownstreamHandler(2)),
      new Outlet<[I1, I2, I3]>(this)
    )
  }

  grabOutput(): [I1, I2, I3] {
    return [
      this.shape.in1.grab(),
      this.shape.in2.grab(),
      this.shape.in3.grab()
    ]
  }
}