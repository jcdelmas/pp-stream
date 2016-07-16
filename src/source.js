import { SourceStage } from './stage';

export class ArraySourceStage extends SourceStage {

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