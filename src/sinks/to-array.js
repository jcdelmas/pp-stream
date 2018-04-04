import { _registerSink } from '../core/sink';
import { reduce } from './reduce';
export function toArray() {
    return reduce((xs, x) => xs.concat([x]), []);
}
_registerSink('toArray', toArray);
//# sourceMappingURL=to-array.js.map