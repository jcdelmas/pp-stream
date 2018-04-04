import { _registerSink } from '../core/sink';
import { forEach } from './for-each';
export function ignore() {
    return forEach(() => { });
}
_registerSink('ignore', ignore);
//# sourceMappingURL=ignore.js.map