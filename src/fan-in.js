import { FanInStage } from './stage';

export class Concat extends FanInStage {

  sourceIndex = 0;

  createInHandler(index) {
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

  createInHandler(index) {
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
        if (!input.hasBeenPulled() && !input.isClosed()) {
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

  createInHandler(index) {
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
