import _ from 'lodash';
import Promise from 'bluebird';

export class Source {

  static fromList(items) {
    return new ListSource(items);
  }

  out = null;
  closed = false;

  _downstreamClose() {
    this._onClose();
    this.closed = true;
    this.out.close();
  }

  _onClose() {}

  map(fn) {
    return this.via(Flow.map(fn));
  }

  filter(fn) {
    return this.via(Flow.filter(fn));
  }

  /**
   * @param {Flow} flow
   * @returns {Source}
   */
  via(flow) {
    flow._plugIn(this);
    this._plugOut(flow);
    return flow;
  }

  _onPull() {
    throw new Error('Not implemented')
  }

  _push(item) {
    try {
      this.out._onPush(item);
    } catch (e) {
      this._error(e);
    }
  }

  _error(e) {
    this.out._onError(e);
  }

  _plugOut(flow) {
    if (this.out) {
      throw new Error('Output already exists !');
    }
    this.out = flow;
  }

  each(cb) {
    return this.runWith(Sink.forEach(cb));
  }

  /**
   * @param {Sink} sink
   */
  runWith(sink) {
    this._plugOut(sink);
    sink._plugIn(this);
    return sink.run();
  }
}

class BasicSource {
  constructor(onPullFn) {
    this._onPull = _.bind(onPullFn, this);
  }
}

class Sink {

  static forEach(cb) {
    return new BasicSink(
      function (item) {
        cb(item);
        this._pull();
      }
    );
  }

  closed = false;

  run() {
    this._pull();
    return new Promise((resolve, reject) => {
      this.resolveHandler = resolve;
      this.rejectHandler = reject;
    })
  }

  _upstreamClose() {
    this._onClose();
    this.closed = true;
    this.in.close();
  }

  _onError(e) {
    this.rejectHandler(e);
  }

  _onPush(item) {
    throw new Error('Not implemented')
  }

  _onClose() {
    this.resolveHandler()
  }

  _pull() {
    this.in._onPull();
  }

  _plugIn(source) {
    if (this.in) {
      throw new Error('Input already exist !');
    }
    this.in = source;
  }
}

class BasicSink {
  constructor(onPushFn, onCloseFn, onErrorFn) {
    this._onPush = _.bind(onPushFn, this);
    if (onCloseFn) {
      this._onClose = _.bind(onCloseFn, this);
    }
    if (onErrorFn) {
      this._onError = _.bind(onErrorFn, this);
    }
  }
}

class ListSource extends Source {
  constructor(items) {
    super();
    this.index = 0;
    this.items = items;
  }

  _onPull() {
    if (this.index < this.items.length) {
      this._push(this.items[this.index++]);
    } else {
      this._downstreamClose();
    }
  }
}

export class Flow extends Source {
  static map(fn) {
    return new BasicFlow(
      function(item) {
        this._push(fn(item))
      },
      function() {
        this._pull();
      }
    );
  }

  static filter(fn) {
    return new BasicFlow(
      function(item) {
        if (fn(item)) {
          this._push(item)
        } else {
          this._pull();
        }
      },
      function() {
        this._pull();
      }
    );
  }

  _onError(e) {
    this.error(e)
  }

  // Sink methods

  _upstreamClose() {
    this._onClose();
    this.closed = true;
    this.in.close();
  }

  _onPush(item) {
    throw new Error('Not implemented')
  }

  _onClose() {}

  _pull() {
    this.in._onPull();
  }

  _plugIn(source) {
    if (this.in) {
      throw new Error('Input already exist !');
    }
    this.in = source;
  }
}

class BasicFlow extends Flow {
  constructor(onPushFn, onPullFn) {
    super();
    this._onPush = _.bind(onPushFn, this);
    this._onPull = _.bind(onPullFn, this);
  }
}
