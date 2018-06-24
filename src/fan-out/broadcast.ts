
import { UniformFanOutShape, UniformFanOutStage } from '../core/fan-out'
import { Graph, Sink } from '../index'
import { combineSinks } from '../sinks/combine'

export function broadcast<A>(size: number): Graph<UniformFanOutShape<A, A>, void> {
  return new Graph(() => new Broadcast<A>(size))
}

export function broadcastSinks<A>(...sinks: Sink<A, any>[]): Sink<A, void> {
  return combineSinks<A, A>(...sinks)(broadcast)
}

class Broadcast<A> extends UniformFanOutStage<A, A> {

  createUpstreamHandler() {
    return {
      onPull: () => {
        this.pullIfReady()
      },
      onCancel: () => {
        if (this.openOutputs().length === 0) {
          this.cancel()
        } else {
          this.pullIfReady()
        }
      }
    };
  }

  pullIfReady() {
    if (this.openOutputs().every(o => o.isAvailable())) {
      this.pull()
    }
  }

  onPush() {
    const x = this.grab()
    this.openOutputs().forEach(output => output.push(x))
  }

  openOutputs() {
    return this.shape.outputs.filter(output => !output.isClosed())
  }
}
