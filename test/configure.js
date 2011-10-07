var vows = require('vows'),
    assert = require('assert'),
    deploy = require('deploy');

vows.describe('Configuration').addBatch({
    'Accepts no parameter': {
        topic: function () {
            return deploy.config;
        },
        'returns base configuration with no initial pargs ': function (topic) {
            var _fnValue = topic();
            assert.deepEqual (_fnValue, {user: 'postgres', password: null, database: 'postgres'});
        },
        'returns updated config when object as arg': function(topic) {
            var _fnValue = topic({host: 'localhost', password: 'password'});
            assert.deepEqual (_fnValue, {user: 'postgres', password: 'password', database: 'postgres', host: 'localhost'});
        },
        'accepts a string as a conf': function(topic) {
            var _fnValue = topic('some_invalid_conf_string');
            assert.equal (_fnValue, 'some_invalid_conf_string');
        }
    }
}).export(module);
