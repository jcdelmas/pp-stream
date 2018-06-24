import { _registerFlow, flow, Flow, FlowStage } from '../core/flow'

export function recover<A>(fn: (error: any) => A): Flow<A, A> {
  return flow(() => new Recover(fn))
}

declare module '../core/source' {
  interface Source<O> {
    recover(fn: (error: any) => O): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    recover(fn: (error: any) => O): Flow<I, O>
  }
}

_registerFlow('recover', recover)

class Recover<A> extends FlowStage<A, A> {

  constructor (private readonly fn: (error: any) => A) {
    super()
  }

  onPush(): void {
    this.push(this.grab())
  }

  onError(e: any) {
    try {
      this.push(this.fn(e))
      this.stop()
    } catch (e) {
      this.error(e)
    }
  }
}
