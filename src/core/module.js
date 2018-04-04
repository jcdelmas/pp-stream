import { some } from 'lodash';
export default class Module {
    constructor(shape, submodules, materializedValue = {}) {
        this.shape = shape;
        this._submodules = submodules;
        this.materializedValue = materializedValue;
    }
    static create(shape, modules, attributes) {
        const materializedValue = Module._mergeMaterialiedValues(modules);
        return new Module(shape, modules, attributes.key ? { [attributes.key]: materializedValue } : materializedValue);
    }
    static _mergeMaterialiedValues(modules) {
        return modules.reduce((acc, m) => (Object.assign({}, m.materializedValue, acc)), {});
    }
    start() {
        if (some(this.shape.inputs, i => !i.isReady())) {
            throw new Error('Not wired input');
        }
        if (some(this.shape.outputs, o => !o.isReady())) {
            throw new Error('Not wired input');
        }
        this._submodules.forEach(m => m.start());
    }
}
//# sourceMappingURL=module.js.map