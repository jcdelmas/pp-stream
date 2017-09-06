import Sink from './sink';
import Module from './module';
import _ from 'lodash';


export default class Stream {

  /**
   * @param {function} stageFactory
   * @returns {Stream}
   */
  static fromSourceStageFactory(stageFactory) {
    return new Stream(0, 1, () => {
      const stage = stageFactory();
      return new Module([], stage.outputs, []);
    });
  }

  /**
   * @param {function} stageFactory
   * @param {number} inputs
   * @param {number} outputs
   * @returns {Stream}
   */
  static fromFlowStageFactory(stageFactory, inputs = 1, outputs = 1) {
    return new Stream(inputs, outputs, () => {
      const stage = stageFactory();
      return new Module(stage.inputs, stage.outputs, []);
    });
  }

  /**
   * @param {function} stageFactory
   * @returns {Stream}
   */
  static fromSinkStageFactory(stageFactory) {
    return new Stream(1, 0, () => {
      const stage = stageFactory();
      return new Module(stage.inputs, [], [stage]);
    });
  }

  static groupStreams(streams) {
    return new Stream(
      _.sum(streams.map(s => s._inCount)),
      _.sum(streams.map(s => s._outCount)),
      () => Module.group(streams.map(s => s._materialize())));
  }

  static fromGraph(inCount, outCount, factory) {
    return new Stream(inCount, outCount, () => {
      const sinks = [];
      const { inputs = [], outputs = [] } = factory({
        add: s => {
          const module = s._materialize();
          module._sinks.forEach(s => sinks.push(s));
          return module.wrapper();
        }
      });
      if (inputs.length != inCount) {
        throw new Error('Invalid inputs number');
      }
      if (outputs.length != outCount) {
        throw new Error('Invalid outputs number');
      }
      return new Module(
        inputs.map(i => i._input),
        outputs.map(o => o._output),
        sinks
      );
    });
  }

  /**
   * @param {number} inputs
   * @param {number} outputs
   * @param {function} materializer
   */
  constructor(inputs, outputs, materializer) {
    this._inCount = inputs;
    this._outCount = outputs;
    this._materialize = materializer;
  }

  /**
   * @param {Stream} stream
   * @return {Stream}
   */
  pipe(stream) {
    if (this._outCount != stream._inCount) {
      throw new Error('Invalid wiring');
    }
    return Stream.fromGraph(this._inCount, stream._outCount, b => {
      const prev = b.add(this);
      const next = b.add(stream);
      prev.outputs().forEach((out, i) => out.wire(next.in(i)));
      return {
        inputs: prev.inputs(),
        outputs: next.outputs()
      };
    });
  }

  /**
   * @param {function} fanInFactory
   * @return {Stream}
   */
  fanIn(fanInFactory) {
    return this.pipe(fanInFactory(this._outCount));
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
