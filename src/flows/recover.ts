import { _registerFlow, Flow, FlowStage } from '../core/flow'
import { isUndefined } from 'util'

export function recover<A>(fn: (error: any) => A | undefined = () => undefined): Flow<A, A, void> {
  return Flow.fromStageFactory(() => new Recover(fn))
}

_registerFlow('recover', recover)

class Recover<A> extends FlowStage<A, A, void> {

  constructor (private readonly fn: (error: any) => A | undefined) {
    super()
  }

  onPush(): void {
    this.push(this.grab())
  }

  onError(e: any) {
    try {
      const result = this.fn(e)
      if (!isUndefined(result)) {
        this.push(result);
      } else {
        this.pull();
      }
    } catch (e) {
      this.error(e);
    }
  }

}
