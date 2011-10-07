var util = require('util'),
    events = require('events'),
    fs = require('fs'),
    migrationParser = require('./lib/migrationParser'),
    _changelog = require('./lib/changelog.js');

// The config used in common by the adapter and the deploy tool
var _config = {
    user: 'postgres',
    password: null,
    database: 'postgres',
    migrationFolder: process.env['PWD'] + '/migrations',
    adapter: null
};

/**
 * Constructor of the main class of the deploy library 
 * Prepares the basic event listeners
 **/
var Deploy = function() {
    events.EventEmitter.call(this);
}

util.inherits(Deploy, events.EventEmitter);

/**
 * Updates the configuration of the module
 * Use it to fit the tool to your needs
 **/
Deploy.prototype.config = function (config) {
    if (config !== undefined) {
        if (typeof(config) === 'string') {
            _config = config
        } else {
            for (idx in config) {
                if (config.hasOwnProperty(idx)) {
                    _config[idx] = config[idx];
                }
            };
        }
    }
    return _config;
};

Deploy.prototype.changelog = null;

/**
 * Runs the db migration workflow:
 *  *) Checks the existence of the changelog table
 *  *) Creates it if it doesn't exist
 *  *) Discovers the latest migration applied
 *  *) applies the subsequent migrations
 * 
 **/
Deploy.prototype.run = function () {
    var me = this;
    
    if (!_config.adapter) {
        throw new Error('No adapter specified. Can not run.');
    }
    _config.adapter.connect(_config, function(err, client) {
        if (err) {
            me.emit('error', err);
        } else {
            me.client = client;
            me.changelog = new _changelog(me.client);
            me.changelog.on('ready', function (err) {
                if (!err) {
                    console.log('* \'changelog\' table present.');
                    me.applyMigrations();
                } else {
                    console.log('* \'changelog\' table not present.');
                    me.changelog.on('built', function () {
                        me.applyMigrations();
                    })
                    me.changelog.build();
                }
            });
            me.changelog.checkTable();         
        }
    });
};

/**
 * Applies the migrations in the specified direction.
 * @TODO Implement the downgrade process. Currently, the direction is not taken into account
 * @param direction string 'up' or 'down'
 **/
Deploy.prototype.applyMigrations = function (direction) {
    var direction = direction || 'do',
        me = this;
    // Filters through the files in the migration folder and finds the
    // statements that need to be applied to the database
    var _getApplicableMigrations = function (files, latestMigrationFile) {
        return files
            .sort()
            .filter(function () {
                var _mustBeApplied = (latestMigrationFile === null);
                return function (name) {
                    if (latestMigrationFile === name) {
                        _mustBeApplied = true;
                        return false;
                    }
                    return _mustBeApplied;
                };
                }()
            );
    };
    
    // Orders the migrations statements to the specified order,
    // so they can be applied in the right place, at the right time
    var _orderMigrations = function (order, unorderedObj) {
        var orderedObj = {};
        for (var i=0; i < order.length; i++) {
            orderedObj[order[i]] = unorderedObj[order[i]];
        }
        return orderedObj;
    };
    
    // Returns a function that, once run, will return the statements
    // to be applied
    var _retrieveStatements = function (latestMigrationFile) {
        return function (err, files) {
            if (err) {
                throw err;
            }
            files = _getApplicableMigrations(files, latestMigrationFile);
            filesRemaining = files.length;
            fileData = {};
            console.log('* Number of migration scripts to apply:', filesRemaining);
            if (filesRemaining === 0) {
                me.client;
            }
            for (file in files) {
                if (files.hasOwnProperty(file)) {
                    
                    var filename = files[file];
                    var filepath = _config.migrationFolder + '/' + filename;
                    var parser = new migrationParser(filepath, me.client);
                    parser.on('ready', function (_do, _undo, filename) {
                        filesRemaining--;
                        fileData[filename] = {
                            'do' : _do,
                            'undo' : _undo 
                        };
                        if (filesRemaining === 0) {
                            var orderedMigrations = _orderMigrations (files, fileData);
                            delete files, fileData; // Not needed anylonger
                            
                            // Here is where the migration really takes place 
                            me.changelog.apply(orderedMigrations, direction);
                        }
                    });
                }
            }
        }
    };
    this.changelog.getLatestMigration(function(latestMigrationFile) {
        console.log('* Latest file applied:', latestMigrationFile || 'none');
        fs.readdir(_config.migrationFolder, _retrieveStatements(latestMigrationFile));
    });
};

module.exports = new Deploy();
