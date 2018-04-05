import { some } from 'lodash';
export default class Module {
    constructor(shape, submodules, attrs, materializedValue) {
        this.shape = shape;
        this.submodules = submodules;
        this.attrs = attrs;
        this.materializedValue = materializedValue;
    }
    start() {
        if (some(this.shape.inputs, i => !i.isReady())) {
            throw new Error('Not wired input');
        }
        if (some(this.shape.outputs, o => !o.isReady())) {
            throw new Error('Not wired input');
        }
        this.submodules.forEach(m => m.start());
    }
}
//# sourceMappingURL=module.js.map