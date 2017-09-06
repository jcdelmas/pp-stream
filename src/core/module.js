import _ from 'lodash';

class InputWrapper {
  constructor(input) {
    this._input = input;
  }
}

class OutputWrapper {
  constructor(output) {
    this._output = output;
  }

  wire(input) {
    return this._output.wire(input._input)
  }
}

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
        return module._inputs.map(input => new InputWrapper(input));
      },

      outputs() {
        return module._outputs.map(output => new OutputWrapper(output));
      },

      in(i = 0) {
        if (module._inputs.length <= i) {
          throw new Error(`No input with index ${i}`);
        }
        return new InputWrapper(module._inputs[i]);
      },

      out(i = 0) {
        if (module._outputs.length <= i) {
          throw new Error(`No output with index ${i}`);
        }
        return new OutputWrapper(module._outputs[i]);
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