import Module from './module';
import { SimpleStage, SourceStage, SinkStage } from './stage';
import { ArraySourceStage } from './source';
import {
  Delay,
  Drop,
  Grouped,
  MapConcat,
  Sliding,
  Scan,
  Take
} from './flow';
import { Reduce } from './sink';
import { Concat, Merge, Zip } from './fan-in';
import { Broadcast, Balance } from './fan-out';

export const Source = {

  create(stageProvider) {
    return new Stream(() => Module.sourceStage(stageProvider()))
  },

  createSimple(methods) {
    return this.create(() => new SourceStage(methods));
  },

  /**
   * @param items
   * @returns {Stream}
   */
  from(items) {
    return this.create(() => new ArraySourceStage(items));
  },

  /**
   * @returns {Stream}
   */
  empty() {
    return this.createSimple({
      onPull() {
        this.complete();
      }
    });
  },

  /**
   * @returns {Stream}
   */
  single(x) {
    return this.createSimple({
      onPull() {
        this.pushAndComplete(x);
      }
    });
  },

  /**
   * @returns {Stream}
   */
  repeat(x) {
    return this.createSimple({
      onPull() {
        this.push(x);
      }
    });
  },

  /**
   * @param stageFactory
   * @param {Stream[]} sources
   * @private
   */
  _fanInSource(stageFactory, sources) {
    return new Stream(() => {
      return Module.merge(...sources.map(s => s._materialize()))
        .wire(Module.flowStage(stageFactory()));
    });
  },

  /**
   * @param {...Stream} sources
   */
  concat(...sources) {
    return this._fanInSource(() => new Concat(), sources);
  },

  /**
   * @param {...Stream} sources
   */
  merge(...sources) {
    return this._fanInSource(() => new Merge(), sources);
  },

  /**
   * @param {...Stream} sources
   * @returns {Stream}
   */
  zip(...sources) {
    return this._fanInSource(() => new Zip(), sources);
  }
};

export const Flow = {

  create(stageProvider) {
    return new Stream(() => Module.flowStage(stageProvider()))
  },

  /**
   * @param stageMethods
   * @returns {Flow}
   */
  createSimple(stageMethods) {
    return this.create(() => new SimpleStage(stageMethods));
  },

  empty() {
    return this.create(() => new SimpleStage());
  },

  /**
   * @param fn
   * @returns {Flow}
   */
  map(fn) {
    return this.createSimple({
      onPush() {
        this.push(fn(this.grab()))
      },
    });
  },

  /**
   * @param fn
   * @returns {Flow}
   */
  filter(fn) {
    return this.createSimple({
      onPush() {
        const x = this.grab();
        if (fn(x)) {
          this.push(x)
        } else {
          this.pull();
        }
      },
    });
  },

  /**
   * @param fn
   * @param zero
   * @returns {Flow}
   */
  scan(fn, zero) {
    return this.create(() => new Scan(fn, zero));
  },

  /**
   * @param fn
   * @returns {Flow}
   */
  mapConcat(fn) {
    return this.create(() => new MapConcat(fn));
  },

  /**
   * @param {number} n
   * @returns {Flow}
   */
  grouped(n) {
    return this.create(() => new Grouped(n));
  },

  /**
   * @param {number} n
   * @param {number} step
   * @returns {Flow}
   */
  sliding(n, step = 1) {
    return this.create(() => new Sliding(n, step));
  },

  /**
   * @param {number} n
   * @returns {Flow}
   */
  take(n) {
    return this.create(() => new Take(n));
  },

  /**
   * @param {number} n
   * @returns {Flow}
   */
  drop(n) {
    return this.create(() => new Drop(n));
  },

  /**
   * @param {number} duration
   * @returns {Flow}
   */
  delay(duration) {
    return this.create(() => new Delay(duration));
  },

  /**
   * @param source
   * @returns {Stream}
   * @private
   */
  _fanInFlow(stageFactory, source) {
    return new Stream(() => {
      return Module.merge(
        Module.flowStage(new SimpleStage()),
        source._materialize()
      ).wire(Module.flowStage(stageFactory()));
    });
  },

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  concat(source) {
    return this._fanInFlow(() => new Concat(), source);
  },

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  merge(source) {
    return this._fanInFlow(() => new Merge(), source);
  },

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  zip(source) {
    return this._fanInFlow(() => new Zip(), source);
  },
};

export const Sink = {

  /**
   * @param stageProvider
   * @returns {Stream}
   */
  create(stageProvider) {
    return new Stream(() => Module.sinkStage(stageProvider()))
  },

  createSimple(stageMethods) {
    return this.create(() => new SinkStage(stageMethods));
  },

  forEach(cb) {
    return this.createSimple({
      onPush() {
        cb(this.grab());
        this.pull();
      }
    });
  },

  reduce(fn, zero) {
    return this.create(() => new Reduce(fn, zero));
  },

  toArray() {
    return this.reduce((xs, x) => xs.concat([x]), []);
  }
};

export const FanOut = {

  /**
   * @param {Stream...} streams
   * @returns {Stream}
   */
  broadcast(...streams) {
    return new Stream(() => {
      return Module.flowStage(new Broadcast())
        .wire(Module.merge(...streams.map(s => s._materialize())));
    });
  },

  /**
   * @param {Stream...} streams
   * @returns {Stream}
   */
  balance(...streams) {
    return new Stream(() => {
      return Module.flowStage(new Balance())
        .wire(Module.merge(...streams.map(s => s._materialize())));
    });
  }
};

export const FanIn = {

  /**
   * @return {Stream}
   */
  concat() {
    return Flow.create(() => new Concat());
  },

  /**
   * @return {Stream}
   */
  merge() {
    return Flow.create(() => new Merge());
  },

  /**
   * @return {Stream}
   */
  zip() {
    return Flow.create(() => new Zip());
  },

  /**
   * @return {Stream}
   */
  zipWith(fn) {
    return this.zip().map(xs => fn(...xs))
  }
};

export default class Stream {

  /**
   * @param materializer
   */
  constructor(materializer) {
    if (typeof materializer !== 'function') {
      throw new Error('Invalid materializer');
    }
    this._materializer = materializer;
  }

  /**
   * @param {Stream} stream
   * @return {Stream}
   */
  pipe(stream) {
    if (typeof stream._materialize !== 'function') {
      throw new Error('stream param expected !');
    }
    return new Stream(() => {
      return this._materialize().wire(stream._materialize())
    });
  }

  /**
   * @param fn
   * @returns {Stream}
   */
  map(fn) {
    return this.pipe(Flow.map(fn));
  }

  /**
   * @param fn
   * @returns {Stream}
   */
  filter(fn) {
    return this.pipe(Flow.filter(fn));
  }

  /**
   * @param fn
   * @param zero
   * @returns {Stream}
   */
  scan(fn, zero) {
    return this.pipe(Flow.scan(fn, zero));
  }

  /**
   * @param fn
   * @returns {Stream}
   */
  mapConcat(fn) {
    return this.pipe(Flow.mapConcat(fn));
  }

  /**
   * @param {number} n
   * @returns {Stream}
   */
  grouped(n) {
    return this.pipe(Flow.grouped(n));
  }

  /**
   * @param {number} n
   * @param {number} step
   * @returns {Stream}
   */
  sliding(n, step = 1) {
    return this.pipe(Flow.sliding(n, step));
  }

  /**
   * @param {number} n
   * @returns {Stream}
   */
  take(n) {
    return this.pipe(Flow.take(n));
  }

  /**
   * @param {number} n
   * @returns {Stream}
   */
  drop(n) {
    return this.pipe(Flow.drop(n));
  }

  /**
   * @param {number} duration
   * @returns {Stream}
   */
  delay(duration) {
    return this.pipe(Flow.delay(duration));
  }

  /**
   * @param {Stream?} source
   * @returns {Stream}
   */
  concat(source) {
    return this.pipe(source ? Flow.concat(source) : FanIn.concat());
  }

  /**
   * @param {Stream?} source
   * @returns {Stream}
   */
  merge(source) {
    return this.pipe(source ? Flow.merge(source) : FanIn.merge());
  }

  /**
   * @param {Stream?} source
   * @returns {Stream}
   */
  zip(source) {
    return this.pipe(source ? Flow.zip(source) : FanIn.zip());
  }

  /**
   * @param fn
   * @return {Stream}
   */
  zipWith(fn) {
    return this.pipe(FanIn.zipWith(fn));
  }

  // Fan out methods

  /**
   * @param {Stream...} sinks
   * @returns {Stream}
   */
  broadcast(...streams) {
    return this.pipe(FanOut.broadcast(...streams));
  }

  /**
   * @param {Stream...} sinks
   * @returns {Stream}
   */
  balance(...streams) {
    return this.pipe(FanOut.balance(...streams));
  }

  // Source methods

  /**
   * @param {Stream} sink
   */
  runWith(sink) {
    return this.pipe(sink).run();
  }

  forEach(cb) {
    return this.runWith(Sink.forEach(cb));
  }

  toArray() {
    return this.runWith(Sink.toArray());
  }

  reduce(fn, zero) {
    return this.runWith(Sink.reduce(fn, zero));
  }

  // Closed graph methods

  /**
   * @returns {Promise}
   */
  run() {
    const promises = this._materialize().run();

    if (promises.length > 1) {
      return Promise.all(promises);
    } else {
      return promises[0];
    }
  }

  /**
   * @returns {Module}
   */
  _materialize() {
    return this._materializer();
  }
}

