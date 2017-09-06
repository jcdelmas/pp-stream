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
  static group(modules, attributes) {
    return Module.create(
      _(modules).map(m => m.inputs).flatten().value(),
      _(modules).map(m => m.outputs).flatten().value(),
      modules,
      attributes
    );
  }

  static create(inputs, outputs, modules, attributes) {
    const materializedValue = Module._mergeMaterialiedValues(modules);
    return new Module(
      inputs,
      outputs,
      modules,
      attributes.key ? { [attributes.key]: materializedValue } : materializedValue
    );
  }

  static fromStageFactory(stageFactory, attributes) {
    const stage = stageFactory();
    return new Module(
      stage.inputs,
      stage.outputs,
      [stage],
      attributes.key ? { [attributes.key]: stage.materializedValue } : {}
    );
  }

  static _mergeMaterialiedValues(modules) {
    return modules.reduce((acc, m) => ({ ...m.materializedValue, ...acc }), {});
  }

  /**
   * @param {Inlet[]} inputs
   * @param {Outlet[]} outputs
   * @param {(Module|Stage)[]} submodules
   * @param {object} attributes
   */
  constructor(inputs, outputs, submodules, materializedValue = {}) {
    this.inputs = inputs;
    this.outputs = outputs;
    this._submodules = submodules;
    this.materializedValue = materializedValue;
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

  start() {
    if (_.some(this.inputs, i => !i.isReady())) {
      throw new Error('Not wired input');
    }
    if (_.some(this.outputs, o => !o.isReady())) {
      throw new Error('Not wired input');
    }
    this._submodules.forEach(m => m.start());
  }
}