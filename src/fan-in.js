import { FanInStage } from './stage';

export class Concat extends FanInStage {

  sourceIndex = 0;

  createDownstreamHandler(index) {
    return {
      onPush: () => {
        this.push(this.inputs[index].grab())
      },
      onComplete: () => {
        this.sourceIndex++;
        if (this.sourceIndex >= this.inputs.length) {
          this.complete();
        } else if (this.isOutputAvailable()) {
          this.inputs[this.sourceIndex].pull();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    this.inputs[this.sourceIndex].pull();
  }

  onCancel() {
    this.inputs.slice(this.sourceIndex).forEach(input => input.cancel());
  }
}

export class Merge extends FanInStage {

  completedInputs = 0;

  createDownstreamHandler(index) {
    return {
      onPush: () => {
        if (this.isOutputAvailable()) {
          this.push(this.inputs[index].grab())
        }
      },
      onComplete: () => {
        this.completedInputs++;
        if (this.completedInputs >= this.inputs.length) {
          this.complete();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    const availableInput = this.inputs.find(input => input.isAvailable());
    if (availableInput) {
      this.push(availableInput.grab());
      if (!availableInput.isClosed()) {
        availableInput.pull();
      }
    } else {
      this.inputs.forEach(input => {
        if (input.canBePulled()) {
          input.pull();
        }
      });
    }
  }

  onCancel() {
    this.inputs.slice(this.sourceIndex).forEach(input => input.cancel());
  }
}

export class Zip extends FanInStage {

  createDownstreamHandler(index) {
    return {
      onPush: () => {
        if (this.inputs.every(i => i.isAvailable())) {
          this.push(this.inputs.map(i => i.grab()));

          if (this.inputs.some(i => i.isClosed())) {
            this.completeStage();
          }
        }
      },
      onComplete: () => {
        if (!this.isOutputClosed() && !this.inputs[index].isAvailable()) {
          this.completeStage();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    this.inputs.forEach(i => i.pull());
  }

  onCancel() {
    this.cancelAll();
  }
}

export class Interleave extends FanInStage {

  constructor(segmentSize) {
    super();
    this.segmentSize = segmentSize;
  }

  completedInputs = 0;

  currentInputIndex = 0;

  count = 0;

  createDownstreamHandler(index) {
    return {
      onPush: () => {
        if (this.isOutputAvailable()) {
          this.push(this.inputs[index].grab());
          this.count++;
          if (this.count === this.segmentSize) {
            this._switchToNextInput();
          }
        }
      },
      onComplete: () => {
        this.completedInputs++;
        if (this.completedInputs >= this.inputs.length) {
          this.complete();
        } else if (this.currentInputIndex === index) {
          this._switchToNextInput();
          if (this.isOutputAvailable()) {
            this.currentInput().pull();
          }
        }
      },
      onError: e => this.error(e)
    };
  }

  _switchToNextInput() {
    this._incrementCurrentInput();
    while (this.currentInput().isClosed()) {
      this._incrementCurrentInput();
    }
    this.count = 0;
  }

  _incrementCurrentInput() {
    this.currentInputIndex = (this.currentInputIndex + 1) % this.inputs.length;
  }

  currentInput() {
    return this.inputs[this.currentInputIndex]
  }

  onPull() {
    this.currentInput().pullIfAllowed();
  }

  onCancel() {
    this.cancelAll();
  }
}
