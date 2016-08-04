"use strict";

import Module from './module';
import { OverflowStrategy } from './buffer';
import { SimpleStage, SourceStage, SinkStage } from './stage';
import { PushSourceStage, ArraySourceStage, CallbackSourceStage } from './source';
import {
  BufferFlow,
  Delay,
  Distinct,
  Drop,
  DropWhile,
  Grouped,
  MapAsync,
  MapConcat,
  Sliding,
  Scan,
  Take,
  TakeWhile,
  Throttle
} from './flow';
import { Reduce, SinkTick } from './sink';
import { Concat, Interleave, Merge, Zip } from './fan-in';
import { Broadcast, Balance } from './fan-out';

export const Source = {

  create(stageProvider) {
    return Stream.fromMaterializer(() => Module.sourceStage(stageProvider()));
  },

  createSimple(methods) {
    return this.create(() => new SourceStage(methods));
  },

  createPushOnly(methods) {
    return this.create(() => new PushSourceStage(methods));
  },

  /**
   * @param items
   * @returns {Stream}
   */
  from(items) {
    return this.create(() => new ArraySourceStage(items));
  },

  /**
   * @param callback
   * @param {int} bufferSize
   * @param {string} bufferOverflowStrategy
   */
  fromCallback(callback, bufferSize = 16, bufferOverflowStrategy = OverflowStrategy.FAIL) {
    return this.create(() => new CallbackSourceStage(callback, bufferSize, bufferOverflowStrategy));
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
    return Stream.fromMaterializer(() => {
      return Module.merge(...sources.map(s => s._materialize()))
        .wireFlow(stageFactory());
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
  },

  /**
   * @param {Stream[]} sources
   * @returns {Stream}
   */
  interleave(sources, segmentSize = 1) {
    return this._fanInSource(() => new Interleave(segmentSize), sources);
  }
};

export const Flow = {

  create(stageProvider) {
    return Stream.fromSourcedMaterializer(source => source._materialize().wireFlow(stageProvider()));
  },

  /**
   * @param stageMethods
   * @returns {Flow}
   */
  createSimple(stageMethods) {
    return this.create(() => new SimpleStage(stageMethods));
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

  mapAsync(fn, parallelism = 1) {
    return this.create(() => new MapAsync(fn, parallelism))
  },

  buffer(size, overflowStrategy = OverflowStrategy.FAIL) {
    return this.create(() => new BufferFlow(size, overflowStrategy))
  },

  throttle(duration, opts = {}) {
    return this.create(() => new Throttle(duration, opts));
  },

  distinct() {
    return this.create(() => new Distinct())
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
   * @param fn
   * @returns {Flow}
   */
  flatMapConcat(fn) {
    return this.create(() => new FlatMapConcat(fn));
  },

  /**
   * @param fn
   * @param {int} breadth
   * @returns {Flow}
   */
  flatMapMerge(fn, breadth = 16) {
    return this.create(() => new FlatMapMerge(fn, breadth));
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
   * @param {function} fn
   * @returns {Flow}
   */
  takeWhile(fn) {
    return this.create(() => new TakeWhile(fn));
  },

  /**
   * @param {number} n
   * @returns {Flow}
   */
  drop(n) {
    return this.create(() => new Drop(n));
  },

  /**
   * @param {function} fn
   * @returns {Flow}
   */
  dropWhile(fn) {
    return this.create(() => new DropWhile(fn));
  },

  /**
   * @param {number} duration
   * @returns {Flow}
   */
  delay(duration) {
    return this.create(() => new Delay(duration));
  },

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  concat(source) {
    return Stream.fromSourceFactory(firstSource => Source.concat(firstSource, source));
  },

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  merge(source) {
    return Stream.fromSourceFactory(firstSource => Source.merge(firstSource, source));
  },

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  zip(source) {
    return Stream.fromSourceFactory(firstSource => Source.zip(firstSource, source));
  },

  /**
   * @param {Stream} source
   * @param {int} segmentSize
   * @returns {Stream}
   */
  interleave(source, segmentSize = 1) {
    return Stream.fromSourceFactory(firstSource => Source.interleave([firstSource, source], segmentSize));
  }
};

export const Sink = {

  /**
   * @param stageProvider
   * @returns {Stream}
   */
  create(stageProvider) {
    return Stream.fromSourcedMaterializer(source => source._materialize().wireSink(stageProvider()));
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

  create(stageProvider, streams) {
    return Stream.fromSourcedMaterializer(source => {
      const stage = stageProvider();
      const baseModule = source._materialize().wireFlow(stage);

      const fanOutSource = Source.create(() => stage);
      const modules = streams.map(stream => fanOutSource.pipe(stream)._materialize());
      return Module.merge(...modules).addSinks(baseModule._sinks);
    });
  },

  /**
   * @param {Stream...} streams
   * @returns {Stream}
   */
  broadcast(...streams) {
    return this.create(() => new Broadcast(), streams);
  },

  /**
   * @param {Stream...} streams
   * @returns {Stream}
   */
  balance(...streams) {
    return this.create(() => new Balance(), streams);
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
  interleave(segmentSize = 1) {
    return Flow.create(() => new Interleave(segmentSize));
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
   * @param fn
   * @return {Stream}
   */
  static fromSourcedMaterializer(fn) {
    return Stream.fromSourceFactory(source => Stream.fromMaterializer(() => fn(source)));
  }

  /**
   * @param materializer
   * @return {Stream}
   */
  static fromMaterializer(materializer) {
    return new Stream({ materializer })
  }

  /**
   * @param sourceFactory
   * @return {Stream}
   */
  static fromSourceFactory(sourceFactory) {
    return new Stream({ sourceFactory })
  }

  constructor({ materializer, sourceFactory }) {
    if (materializer) {
      if (typeof materializer !== 'function') {
        throw new Error('Invalid materializer');
      }
      this._materialize = materializer;
      this._isSource = true;
    } else {
      if (typeof sourceFactory !== 'function') {
        throw new Error('Invalid sourceFactory');
      }
      this._wireSource = sourceFactory;
      this._isSource = false;
    }
  }

  /**
   * @returns {Module}
   */
  _materialize() {
    throw new Error('Not a source stream');
  }

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  _wireSource(source) {
    throw new Error('Not allowed on source stream');
  }

  /**
   * @param {Stream} stream
   * @return {Stream}
   */
  pipe(stream) {
    if (this._isSource) {
      return Stream.fromMaterializer(() => stream._wireSource(this)._materialize());
    } else {
      return Stream.fromSourceFactory(source => stream._wireSource(this._wireSource(source)));
    }
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
   * @param {int} parallelism
   * @return {Stream}
   */
  mapAsync(fn, parallelism = 1) {
    return this.pipe(Flow.mapAsync(fn, parallelism));
  }

  /**
   * @param {int} size
   * @param {string} overflowStrategy
   * @returns {Stream}
   */
  buffer(size, overflowStrategy = OverflowStrategy.FAIL) {
    return this.pipe(Flow.buffer(size, overflowStrategy));
  }

  /**
   * @param {int} duration
   * @param {object} opts
   * @returns {Stream}
   */
  throttle(duration, opts = {}) {
    return this.pipe(Flow.throttle(duration, opts));
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
   * @param fn
   * @return {Stream}
   */
  flatMapConcat(fn) {
    return this.pipe(Flow.flatMapConcat(fn));
  }

  /**
   * @param fn
   * @param {int} breadth
   * @return {Stream}
   */
  flatMapMerge(fn, breadth = 16) {
    return this.pipe(Flow.flatMapMerge(fn, breadth));
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
   * @param {function} fn
   * @returns {Stream}
   */
  takeWhile(fn) {
    return this.pipe(Flow.takeWhile(fn));
  }

  /**
   * @param {number} n
   * @returns {Stream}
   */
  drop(n) {
    return this.pipe(Flow.drop(n));
  }

  /**
   * @param {function} fn
   * @returns {Stream}
   */
  dropWhile(fn) {
    return this.pipe(Flow.dropWhile(fn));
  }

  distinct() {
    return this.pipe(Flow.distinct());
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

  /**
   * @param {Stream} source
   * @param {int} segmentSize
   * @returns {Stream}
   */
  interleave(source, segmentSize = 1) {
    return this.pipe(Flow.interleave(source, segmentSize));
  }

  /**
   * @param segmentSize
   * @return {Stream}
   */
  interleaveStreams(segmentSize = 1) {
    return this.pipe(FanIn.interleave(segmentSize));
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

  /**
   * @param {SinkStage} sinkStage
   */
  runWithLastStage(sinkStage) {
    return this.runWith(Sink.create(() => sinkStage));
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
}


// Higher order stages

class FlatMapConcat extends SimpleStage {
  constructor(fn) {
    super();
    this.fn = fn;
  }

  /**
   * @type {SinkStage|null}
   */
  current = null;

  completePending = false;

  onPush() {
    const parent = this;
    const source = this.fn(this.grab());

    this.current = new SinkStage({
      onPush() {
        parent.push(this.grab())
      },

      onComplete() {
        parent.current = null;
        if (parent.completePending) {
          parent.complete();
        }
      }
    });
    source.runWithLastStage(this.current);
  }

  onPull() {
    if (this.current) {
      this.current.onPull();
    } else {
      this.pull();
    }
  }

  onCancel() {
    if (this.current) {
      this.current.onCancel();
    }
    this.cancel();
  }

  onComplete() {
    if (!this.current) {
      this.complete();
    } else {
      this.completePending = true;
    }
  }
}
class FlatMapMerge extends SimpleStage {
  constructor(fn, breadth = 16) {
    super();
    this.fn = fn;
    this.breadth = breadth;
  }

  stages = [];

  completePending = false;

  onPush() {
    const parent = this;
    const source = this.fn(this.grab());

    const stage = new SinkStage({
      onPush() {
        parent.push(this.grab())
      },

      onComplete() {
        const i = parent.stages.indexOf(this);
        parent.stages.splice(i, 1);

        if (parent.completePending && parent.stages.length === 0) {
          parent.complete();
        } else if (!parent.isInputClosed()) {
          parent.pull();
        }
      }
    });
    this.stages.push(stage);
    source.runWithLastStage(stage);

    if (this.stages.length < this.breadth) {
      this.pull();
    }
  }

  onPull() {
    if (this.stages.length > 0) {
      const availableStage = this.stages.find(stage => stage.isInputAvailable());
      if (availableStage) {
        this.push(availableStage.grab());
      }
      this.stages.forEach(stage => {
        if (!stage.isInputHasBeenPulled() && !stage.isInputClosed()) {
          stage.pull();
        }
      });
    } else {
      this.pull();
    }
  }

  onCancel() {
    this.stages.forEach(stage => stage.onCancel());
    this.cancel();
  }

  onComplete() {
    if (this.stages.length === 0) {
      this.complete();
    } else {
      this.completePending = true;
    }
  }
}
