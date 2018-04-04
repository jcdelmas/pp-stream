import { _registerSink } from '../core/sink';
import { reduce } from './reduce';
export function last() {
    return reduce((last, x) => x, undefined);
}
_registerSink('last', last);
//# sourceMappingURL=last.js.map