
import _ from 'lodash';

export default class Module {

  static sourceStage(stage) {
    return new Module([], [stage], []);
  }

  static sinkStage(stage) {
    return new Module([stage], [], [stage]);
  }

  static flowStage(stage) {
    return new Module([stage], [stage], []);
  }

  static merge(...modules) {
    const inputs = _(modules).map(m => m._inputs).flatten().value();
    const outputs = _(modules).map(m => m._outputs).flatten().value();
    const sinks = _(modules).map(m => m._sinks).flatten().value();
    return new Module(inputs, outputs, sinks);
  }

  /**
   * @param {Stage[]} inputs
   * @param {Stage[]} outputs
   * @param {SinkStage[]} sinks
   */
  constructor(inputs, outputs, sinks) {
    this._inputs = inputs || [];
    this._outputs = outputs || [];
    this._sinks = sinks || [];
  }

  /**
   * @param {Module} module
   * @return {Module}
   */
  wire(module) {
    if (module._inputs.length === 0) {
      throw new Error('No input available in module argument');
    }
    if (this._outputs.length === 0) {
      throw new Error('No output available in this module');
    }

    if (this._outputs.length === module._inputs.length) {
      this._outputs.forEach((output, i) => output._addDownstreamStage(module._inputs[i]))
    } else if (this._outputs.length > 1 && module._inputs.length === 1) {
      this._outputs.forEach(output => output._addDownstreamStage(module._inputs[0]))
    } else if (this._outputs.length === 1 && module._inputs.length > 1) {
      module._inputs.forEach(input => this._outputs[0]._addDownstreamStage(input))
    } else {
      throw new Error('Outputs inputs number mismatch');
    }

    const inputs = this._inputs;
    const outputs = module._outputs;
    const sinks = module._sinks;
    return new Module(inputs, outputs, sinks);
  }

  /**
   * @returns {Promise[]}
   */
  run() {
    if (this._inputs.length > 0) {
      throw new Error('Not runnable module: contains input(s)');
    }
    if (this._outputs.length > 0) {
      throw new Error('Not runnable module: contains output(s)');
    }
    if (this._sinks.length === 0) {
      throw new Error('Not runnable module: no sink(s)');
    }

    return this._sinks.map(s => {
      s.pull();
      return s._getResult();
    });
  }
}