var vows = require('vows'),
    assert = require('assert'),
    deploy = require('deploy');

vows.describe('Inits deploy').addBatch({
    'changeLog table': {
        topic: function () {
            var mockAdapter = require('./mock/adapter');
            var adapter = new mockAdapter.mock(deploy);
            adapter.tableNotCreated();
            deploy.config({adapter: adapter});
            deploy.on('checkChangelog', this.callback);
            return deploy.run();
        },
        'returns an error if not created': function (err, result) {
            assert.notEqual(err, null);
        }
    }
}).export(module);
