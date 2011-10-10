var fs = require('fs'),
    util = require('util'),
    events = require('events');

/**
 * Constructor of the class. The class is used to parse an SQL file
 * If the file contains the '--//@UNDO string, then the statements above
 * apply for the upgrade procedure, the statements below the marker to the downgrade procedure.
 * If not present, the file if considered as not having a downgrade procedure
 * 
 **/
var migrationParser = function (filepath, client) {
    events.EventEmitter.call(this);
    var _client = client,
        me = this;

    var _doLines = '',
        _undoLines = '';

    /**
     * Reads the contents passed by a readable stream,
     * looking for the marker.
     * Separates the contents of the file in two strings.
     * @param rs Stream readable stream
     **/
    this.parse = function (rs) {
        var _isDo = true,
            _separator = '--//@UNDO';
        rs.on('data', function (buffer) {
            var newLine = '\n'.charCodeAt(0);
            if (typeof buffer === 'string') buffer = new Buffer(buffer);

            for (var i = 0; i < buffer.length; i++) {
                if (buffer[i] === newLine) {
                    var endCut = Math.min(buffer.length, 1 + parseInt(i) + _separator.length);
                    if (buffer.slice(parseInt(i)+1, endCut).toString() === _separator) {
                        _isDo = false;
                        i = (1 + parseInt(i) + _separator.length) + '';
                    }
                } else {
                    if (_isDo) {
                        _doLines += String.fromCharCode(buffer[i]);
                    } else {
                        _undoLines += String.fromCharCode(buffer[i]);
                    }
                }
            }
        });
    };
    
    this.__defineGetter__('do', function() {
        return _doLines;
    });
    
    this.__defineGetter__('undo', function() {
        return _undoLines;
    });
    
    this.__defineGetter__('file', function() {
        return filepath;
    });

    var readStream = fs.createReadStream(filepath);
    this.parse(readStream, _doLines, _undoLines);
    readStream.on('end', function () {
        me.emit('ready');
    });
    
};

util.inherits(migrationParser, events.EventEmitter);

module.exports = migrationParser;
