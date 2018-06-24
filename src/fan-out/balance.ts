
import { UniformFanOutShape, UniformFanOutStage } from '../core/fan-out'
import { Outlet } from '../core/stage'
import { Graph, Sink } from '../'
import { combineSinks } from '../sinks/combine'

export function balance<A>(size: number): Graph<UniformFanOutShape<A, A>, void> {
  return new Graph(() => new Balance<A>(size))
}

export function balanceSinks<A>(...sinks: Sink<A, any>[]): Sink<A, void> {
  return combineSinks<A, A>(...sinks)(balance)
}

class Balance<A> extends UniformFanOutStage<A, A> {

  constructor(outCount: number) {
    super(outCount)
  }

  createUpstreamHandler() {
    return {
      onPull: () => {
        this.pullIfAllowed()
      },
      onCancel: () => {
        if (!this.openOutputs().length) {
          this.cancel()
        }
      }
    };
  }

  onPush() {
    this.firstAvailableOutput().push(this.grab())
    if (this.firstAvailableOutput()) {
      this.pull()
    }
  }

  private openOutputs(): Outlet<A>[] {
    return this.shape.outputs.filter(output => !output.isClosed())
  }

  private firstAvailableOutput(): Outlet<A> | undefined {
    return this.shape.outputs.find(output => output.isAvailable())
  }
}
