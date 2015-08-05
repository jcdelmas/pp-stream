
var Promise = require("bluebird");
var _ = require("lodash");

function Stream() {
};

Stream.prototype.map = function(fn) {
  var self = this
  return new DefaultStream(function() {
    return self.next().then(function(item) {
      return !item.done ? { value: fn(item.value), done: false } : item;
    });
  });
};

Stream.prototype.filter = function(fn) {
  var self = this;

  function _filter() {
    return self.next().then(function(item) {
      if (item.done || fn(item.value)) {
        return item;
      } else {
        return _filter();
      }
    });
  };
  return new DefaultStream(_filter);
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

function DefaultStream(nextFn) {
  this.next = nextFn;
};
DefaultStream.prototype = _.create(Stream.prototype);

function ListStream(items) {
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

module.exports = {
  Stream: Stream,
  ListStream: ListStream
};
