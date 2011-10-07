var events = require('events'),
    util = require('util');


var mock = function (deploy) {
    events.EventEmitter.call(this);
    this.deploy = deploy;
};

util.inherits(mock, events.EventEmitter);

mock.prototype.connect = function () {};

mock.prototype.tableNotCreated = function () {
    this.connect = function () {
        this.deploy.client = { query: require('deploy/lib/changelog')};
        this.deploy.emit('checkChangelog', new Error('error'));
    }
};

module.exports.mock = mock;