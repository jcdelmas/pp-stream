
import _ from 'lodash';

export default class Module {

  static sourceStage(stage) {
    return new Module([stage], []);
  }

  static merge(...modules) {
    const outputs = _(modules).map(m => m._outputs).flatten().value();
    const sinks = _(modules).map(m => m._sinks).flatten().value();
    return new Module(outputs, sinks);
  }

  /**
   * @param {Stage[]} outputs
   * @param {SinkStage[]} sinks
   */
  constructor(outputs, sinks) {
    this._outputs = outputs || [];
    this._sinks = sinks || [];
  }

  /**
   * @param {Stage} stage
   * @return {Module}
   */
  wireFlow(stage) {
    return this._wire(stage, true);
  }

  /**
   * @param {Stage} stage
   * @return {Module}
   */
  wireSink(stage) {
    return this._wire(stage, false);
  }

  /**
   * @param {SinkStage[]} sinks
   */
  addSinks(sinks) {
    return sinks.length ? new Module(this._outputs, this._sinks.concat(sinks)) : this;
  }

  /**
   * @param {Stage} stage
   * @param {boolean} asFlow
   * @return {Module}
   */
  _wire(stage, asFlow) {
    if (this._outputs.length === 0) {
      throw new Error('No output available in this module');
    }

    this._outputs.forEach((output, i) => output._addDownstreamStage(stage));

    if (asFlow) {
      return new Module([stage], this._sinks);
    } else {
      return new Module([], [...this._sinks, stage]);
    }
  }

  /**
   * @returns {Promise[]}
   */
  run() {
    if (this._outputs.length > 0) {
      throw new Error('Not runnable module: contains output(s)');
    }
    if (this._sinks.length === 0) {
      throw new Error('Not runnable module: no sink(s)');
    }

    this._sinks.forEach(s => s.start());
    this._sinks.forEach(s => s.pull());
    return this._sinks.map(s => s._getResult());
  }
}