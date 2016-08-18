"use strict";

import Module from './module';
import Source from './source';
import Flow from './flow';
import { SinkStage } from './sink';
import { Reduce, SinkTick } from './sink';
import { Concat, Interleave, Merge, Zip } from './fan-in';
import { Broadcast, Balance } from './fan-out';

/**
 * @param stageFactory
 * @param {Stream[]} sources
 * @private
 */
function _fanInSource(stageFactory, sources) {
  return Stream.fromMaterializer(() => {
    return Module.merge(...sources.map(s => s._materialize()))
      .wireFlow(stageFactory());
  });
}

Object.assign(Source, {

  /**
   * @param {...Stream} sources
   */
  concat(...sources) {
    return _fanInSource(() => new Concat(), sources);
  },

  /**
   * @param {...Stream} sources
   */
  merge(...sources) {
    return _fanInSource(() => new Merge(), sources);
  },

  /**
   * @param {...Stream} sources
   * @returns {Stream}
   */
  zip(...sources) {
    return _fanInSource(() => new Zip(), sources);
  },

  /**
   * @param {Stream[]} sources
   * @returns {Stream}
   */
  interleave(sources, segmentSize = 1) {
    return _fanInSource(() => new Interleave(segmentSize), sources);
  }
});

Object.assign(Flow, {

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
});

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
