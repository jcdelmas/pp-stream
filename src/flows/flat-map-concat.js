import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';
import { SinkStage } from '../core/sink';

/**
 * @param fn
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function flatMapConcat(fn) {
  return create(() => new FlatMapConcat(fn));
}

_registerFlow('flatMapConcat', flatMapConcat);

class FlatMapConcat extends Stage {
  constructor(fn) {
    super();
    this.fn = fn;
  }

  /**
   * @type {SinkStage|null}
   */
  current = null;

  completePending = false;

  onPush() {
    const parent = this;
    const source = this.fn(this.grab());

    this.current = new SinkStage({
      onPush() {
        parent.push(this.grab())
      },

      onComplete() {
        parent.current = null;
        if (parent.completePending) {
          parent.complete();
        }
      },

      onStart() {
        this.pull();
      }
    });
    source.runWithLastStage(this.current);
  }

  onPull() {
    if (this.current) {
      this.current.pullIfAllowed();
    } else {
      this.pull();
    }
  }

  onCancel() {
    if (this.current) {
      this.current.onCancel();
    }
    this.cancel();
  }

  onComplete() {
    if (!this.current) {
      this.complete();
    } else {
      this.completePending = true;
    }
  }
}
