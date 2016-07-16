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
import { Concat, Zip } from './fan-in';
import { Broadcast, Balance } from './fan-out';

export const Source = {

  _simple(stageProvider) {
    return new Stream(() => Module.sourceStage(stageProvider()))
  },

  create(methods) {
    return this._simple(() => new SourceStage(methods));
  },

  /**
   * @param items
   * @returns {Stream}
   */
  from(items) {
    return this._simple(() => new ArraySourceStage(items));
  },

  /**
   * @returns {Stream}
   */
  empty() {
    return this.create({
      onPull() {
        this.complete();
      }
    });
  },

  /**
   * @returns {Stream}
   */
  single(x) {
    return this.create({
      onPull() {
        this.pushAndComplete(x);
      }
    });
  },

  /**
   * @returns {Stream}
   */
  repeat(x) {
    return this.create({
      onPull() {
        this.push(x);
      }
    });
  },

  /**
   * @param {Source[]} sources
   */
  concat(...sources) {
    return new Stream(() => {
      return Module.merge(...sources.map(s => s._materialize()))
        .wire(Module.flowStage(new Concat()));
    });
  },

  /**
   * @param {Source[]|SourceStage[]} sources
   * @returns {Stream}
   */
  zip(...sources) {
    return new Stream(() => {
      return Module.merge(...sources.map(s => s._materialize()))
        .wire(Module.flowStage(new Zip()));
    });
  }
};

export const Flow = {

  _simple(stageProvider) {
    return new Stream(() => Module.flowStage(stageProvider()))
  },

  /**
   * @param stageMethods
   * @returns {Flow}
   */
  create(stageMethods) {
    return this._simple(() => new SimpleStage(stageMethods));
  },

  empty() {
    return this._simple(() => new SimpleStage());
  },

  /**
   * @param fn
   * @returns {Flow}
   */
  map(fn) {
    return this.create({
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
    return this.create({
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
    return this._simple(() => new Scan(fn, zero));
  },

  /**
   * @param fn
   * @returns {Flow}
   */
  mapConcat(fn) {
    return this._simple(() => new MapConcat(fn));
  },

  /**
   * @param {number} n
   * @returns {Flow}
   */
  grouped(n) {
    return this._simple(() => new Grouped(n));
  },

  /**
   * @param {number} n
   * @param {number} step
   * @returns {Flow}
   */
  sliding(n, step = 1) {
    return this._simple(() => new Sliding(n, step));
  },

  /**
   * @param {number} n
   * @returns {Flow}
   */
  take(n) {
    return this._simple(() => new Take(n));
  },

  /**
   * @param {number} n
   * @returns {Flow}
   */
  drop(n) {
    return this._simple(() => new Drop(n));
  },

  /**
   * @param {number} duration
   * @returns {Flow}
   */
  delay(duration) {
    return this._simple(() => new Delay(duration));
  },

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  concat(source) {
    return new Stream(() => {
      return Module.merge(
        Module.flowStage(new SimpleStage()),
        source._materialize()
      ).wire(Module.flowStage(new Concat()));
    });
  },

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  zip(source) {
    return new Stream(() => {
      return Module.merge(
        Module.flowStage(new SimpleStage()),
        source._materialize()
      ).wire(Module.flowStage(new Zip()));
    });
  },
};

export const Sink = {
  /**
   * @param stageProvider
   * @returns {Stream}
   * @private
   */
  _simple(stageProvider) {
    return new Stream(() => Module.sinkStage(stageProvider()))
  },

  create(stageMethods) {
    return this._simple(() => new SinkStage(stageMethods));
  },

  forEach(cb) {
    return this.create({
      onPush() {
        cb(this.grab());
        this.pull();
      }
    });
  },

  reduce(fn, zero) {
    return this._simple(() => new Reduce(fn, zero));
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
    return new Stream(() => Flow._simple(() => new Concat()));
  },

  /**
   * @return {Stream}
   */
  zip() {
    return new Stream(() => Flow._simple(() => new Zip()));
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
    ;
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
   * @param {Stream} source
   * @returns {Stream}
   */
  concat(source) {
    return this.pipe(source ? Flow.concat(source) : FanIn.concat());
  }

  /**
   * @param {Stream|null} source
   * @returns {Stream}
   */
  zip(source) {
    return this.pipe(source ? Flow.zip(source) : FanIn.zip());
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

