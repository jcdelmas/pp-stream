import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';
import { SinkStage } from '../core/sink';

/**
 * @param fn
 * @param {int} breadth
 * @returns {Flow}
 */
export function flatMapMerge(fn, breadth = 16) {
  return create(() => new FlatMapMerge(fn, breadth));
}

_registerFlow('flatMapMerge', flatMapMerge);

class FlatMapMerge extends Stage {
  constructor(fn, breadth = 16) {
    super();
    this.fn = fn;
    this.breadth = breadth;
  }

  stages = [];

  completePending = false;

  onPush() {
    const parent = this;
    const source = this.fn(this.grab());

    const stage = new SinkStage({
      onPush() {
        parent.push(this.grab())
      },

      onComplete() {
        const i = parent.stages.indexOf(this);
        parent.stages.splice(i, 1);

        if (parent.completePending && parent.stages.length === 0) {
          parent.complete();
        } else if (!parent.isInputClosed()) {
          parent.pull();
        }
      }
    });
    this.stages.push(stage);
    source.runWithLastStage(stage);

    if (this.stages.length < this.breadth) {
      this.pull();
    }
  }

  onPull() {
    if (this.stages.length > 0) {
      const availableStage = this.stages.find(stage => stage.isInputAvailable());
      if (availableStage) {
        this.push(availableStage.grab());
      }
      this.stages.forEach(stage => stage.pullIfAllowed());
    } else {
      this.pull();
    }
  }

  onCancel() {
    this.stages.forEach(stage => stage.onCancel());
    this.cancel();
  }

  onComplete() {
    if (this.stages.length === 0) {
      this.complete();
    } else {
      this.completePending = true;
    }
  }
}
