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
    const inputs = _(modules).map(m => m.inputs).flatten().value();
    const outputs = _(modules).map(m => m.outputs).flatten().value();
    const sinks = _(modules).map(m => m._sinks).flatten().value();
    return new Module(inputs, outputs, sinks);
  }

  /**
   * @param {Inlet[]} inputs
   * @param {Outlet[]} outputs
   * @param {SinkStage[]} sinks
   */
  constructor(inputs, outputs, sinks) {
    this.inputs = inputs || [];
    this.outputs = outputs || [];
    this._sinks = sinks || [];
  }

  wrapper() {
    const module = this;
    return {
      inputs() {
        return module.inputs.map(input => new InputWrapper(input));
      },

      outputs() {
        return module.outputs.map(output => new OutputWrapper(output));
      },

      in(i = 0) {
        if (module.inputs.length <= i) {
          throw new Error(`No input with index ${i}`);
        }
        return new InputWrapper(module.inputs[i]);
      },

      out(i = 0) {
        if (module.outputs.length <= i) {
          throw new Error(`No output with index ${i}`);
        }
        return new OutputWrapper(module.outputs[i]);
      }
    }
  }

  /**
   * @returns {Promise[]}
   */
  run() {
    if (this.inputs.length > 0) {
      throw new Error('Not runnable module: contains input(s)');
    }
    if (this.outputs.length > 0) {
      throw new Error('Not runnable module: contains output(s)');
    }
    if (this._sinks.length === 0) {
      throw new Error('Not runnable module: no sink(s)');
    }

    this._sinks.forEach(s => s.onStart());
    return this._sinks.map(s => s._getResult());
  }
}