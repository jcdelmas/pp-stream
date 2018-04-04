import { _registerFlow, Flow, FlowStage } from '../core/flow'
import { isUndefined } from 'util'

export function recover<O>(fn: (error: any) => O | undefined = () => undefined): Flow<O, O> {
  return Flow.fromStageFactory(() => new Recover(fn))
}

_registerFlow('recover', recover)

class Recover<O> extends FlowStage<O, O> {

  constructor (private readonly fn: (error: any) => O | undefined) {
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
