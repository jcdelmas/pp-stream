import _ from 'lodash';

export default class Module {

  /**
   * @param {Module[]} modules
   * @returns {Module}
   */
  static group(modules) {
    const inputs = _(modules).map(m => m._inputs).flatten().value();
    const outputs = _(modules).map(m => m._outputs).flatten().value();
    const sinks = _(modules).map(m => m._sinks).flatten().value();
    return new Module(inputs, outputs, sinks);
  }

  /**
   * @param {Stage[]} outputs
   * @param {SinkStage[]} sinks
   */
  constructor(inputs, outputs, sinks) {
    this._inputs = inputs || [];
    this._outputs = outputs || [];
    this._sinks = sinks || [];
  }

  wrapper() {
    const module = this;
    return {
      inputs() {
        return module._inputs.map((input, i) => this.in(i));
      },

      outputs() {
        return module._outputs.map((output, i) => this.out(i));
      },

      in(i = 0) {
        if (module._inputs.length <= i) {
          throw new Error(`No input with index ${i}`);
        }
        return {
          _input: module._inputs[i]
        }
      },

      out(i = 0) {
        if (module._outputs.length <= i) {
          throw new Error(`No output with index ${i}`);
        }
        return {
          wire: input => module._outputs[i]._addDownstreamStage(input._input),
          _output: module._outputs[i]
        };
      }
    }
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

    this._sinks.forEach(s => s.start());
    this._sinks.forEach(s => s.pull());
    return this._sinks.map(s => s._getResult());
  }
}