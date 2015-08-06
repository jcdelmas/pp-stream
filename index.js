
var Promise = require("bluebird");
var _ = require("lodash");

function Stream() {
  this.closed = false
};

Stream.prototype.wrapper = StreamWrapper;

Stream.prototype.close = function() {
  ths.closed = true;
}

Stream.prototype.map = function(fn) {
  var self = this;
  return new self.wrapper(self, function() {
    return this.wrapped.next().then(function(item) {
      return !item.done ? { value: fn(item.value), done: false } : item;
    });
  });
};

Stream.prototype.filter = function(fn) {
  var self = this;

  function _filter() {
    var self = this;
    return self.wrapped.next().then(function(item) {
      if (item.done || fn(item.value)) {
        return item;
      } else {
        return self.next();
      }
    });
  };
  return new self.wrapper(self, _filter);
};

Stream.prototype.pipe = function(pipe) {
  var self = this;
  (function _consume() {
    pipe.ready().then(function(consumer) {
      if (!consumer.done) {
        self.next().then(consumer.push).catch(consumer.error);
        _consume();
      } else {
        self.close();
      }
    });
  })();
  return pipe;
};

Stream.prototype.each = function(cb, done, failure) {
  var self = this;

  self.next().then(function(item) {
    if (!item.done) {
      cb(item.value);
      self.each(cb);
    } else if (typeof done === 'function') {
      done(item.value);
    }
  }).catch(function(err) {
    if (typeof failure === 'function') {
      failure(err);
    }
  });
};

function StreamWrapper(wrapped, nextFn) {
  this.wrapped = wrapped;
  this.next = _.bind(nextFn, this);
};
StreamWrapper.prototype = _.create(Stream.prototype);

StreamWrapper.prototype.close = function() {
  this.wrapped.close();
}

function ListStream(items) {
  Stream.call(this);
  this.index = 0;
  this.items = items;
};

ListStream.prototype = _.create(Stream.prototype);

ListStream.prototype.next = function() {
  if (this.index < this.items.length) {
    return Promise.resolve({value: this.items[this.index++], done: false});
  } else {
    return Promise.resolve({value: null, done: true});
  }
};

function Pipe() {
  Stream.call(this);
  this.nextResolve = null;
  this.nextReject = null;

  this.readyResolve = null;
  this.readyReject = null;
}
Pipe.prototype = _.create(Stream.prototype);

Pipe.prototype.wrapper = PipeWrapper;

Pipe.prototype.ready = function() {
  var self = this;
  if (self.readyResolve !== null) {
    throw new Error('Invalid state');
  } else if (self.nextResolve !== null) {
    return Promise.resolve({
      push: self.nextResolve,
      error: self.nextReject,
      done: false
    });
    self.nextResolve = null;
    self.nextReject = null;
  } else {
    return new Promise(function(resolve, reject) {
      self.readyResolve = resolve;
      self.readyReject = reject;
    });
  }
};

Pipe.prototype.next = function() {
  var self = this;
  if (self.nextResolve !== null) {
    throw new Error('Invalid state');
  } else if (self.readyResolve !== null) {
    return new Promise(function(resolve, reject) {
      self.readyResolve({
        push: resolve,
        error: reject,
        done: false
      });
      self.readyResolve = null;
      self.readyReject = null;
    });
  } else {
    return new Promise(function(resolve, reject) {
      self.nextResolve = resolve;
      self.nextReject = reject;
    });
  }
};

function PipeWrapper(wrapped, nextFn, readyFn) {
  this.wrapped = wrapped;
  if (typeof nextFn === 'function') {
      this.next = _.bind(nextFn, this);
  }

  if (typeof readyFn === 'function') {
      this.ready = _.bind(readyFn, this);
  }
}
PipeWrapper.prototype = _.create(Pipe.prototype);

PipeWrapper.prototype.next = function() {
  return this.wrapped.next();
};

PipeWrapper.prototype.ready = function() {
  return this.wrapped.ready();
};

module.exports = {
  Stream: Stream,
  ListStream: ListStream,
  Pipe: Pipe,
};
