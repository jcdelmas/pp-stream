"use strict";

import Module from './module';
import Sink from './sink';

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
    throw new Error('Not a sources stream');
  }

  /**
   * @param {Stream} source
   * @returns {Stream}
   */
  _wireSource(source) {
    throw new Error('Not allowed on sources stream');
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
