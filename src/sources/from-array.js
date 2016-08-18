
import Source, { create, SourceStage } from '../core/source';

export function fromArray(items) {
  return create(() => new ArraySourceStage(items));
}

Source.from = fromArray;

class ArraySourceStage extends SourceStage {

  index = 0;

  constructor(items) {
    super();
    this.items = items;
  }

  onPull() {
    if (this.index < this.items.length) {
      this.push(this.items[this.index++]);
    }
    if (this.index == this.items.length) {
      this.complete();
    }
  }
}