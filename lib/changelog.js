var events = require('events'),
    util = require('util'),
    _client;

//The SQL statement that will create the changelog table
var _createScript = 'CREATE TABLE changelog ('
    + 'change_number integer NOT NULL,'
    + 'complete_dt timestamp NOT NULL,'
    + 'applied_by VARCHAR(100) NOT NULL,'
    + 'description VARCHAR(500) NOT NULL'
    + ');'
    + 'ALTER TABLE changelog ADD CONSTRAINT Pkchangelog PRIMARY KEY (change_number);';

/**
 * Changelog is in charge of checking the existence of the migrations reference table,
 * creating the migrations reference table  if not available
 * and applying the migrations
 * @param client onject the client used to perform SQL requests
 * @param migrationFolder string The path to the migration files
 */
var changelog = function (client, migrationFolder) {
    events.EventEmitter.call(this);
    if (client === undefined) {
        throw new Error ('no client provided');
    }
    _client = client;
    
    this.__defineGetter__('migrationFolder', function () {
        return migrationFolder;
    });
    this.__defineSetter__('migrationFolder', function () {});
};

util.inherits(changelog, events.EventEmitter);

/**
 * Build the changelog table.
 * Sends a 'built' event when done.
 **/
changelog.prototype.build = function () { 
    console.log('* Building changelog table.');
    var me = this;
    _client.query(_createScript, function (err, result) {
        if (err) {
            throw new Error('Unable to create the changelog table');
        }
        console.log('* Table changelog built.');
        me.emit('built');
    });
};

/**
 * Applies the migrations in the indicated direction
 * @param direction 'do' or 'undo'
 **/
changelog.prototype.getLatestMigration = function (_callback, scope) {
    var me = this;
    
    _client.query('select description from changelog order by change_number DESC limit 1', function (err, result) {
        var latestMigrationFile;
        if (result.rowCount === 0) {
            latestMigrationFile = null;
        } else {
            latestMigrationFile = result.rows[0].description;
        }
        var _callbackScope = scope || me;
        _callback.call(_callbackScope, latestMigrationFile);
    });
};

/**
 * Applies the migrations in the first arguments.
 * The parameter 'migrations' is expected to be an object litteral with filenames as keys.
 * Values will be an object litteral with two keys: 'up' and 'down'
 * @param migrations object See description
 * @param direction string 'up' or 'down'
 */
changelog.prototype.apply = function (migrations, direction) {
    var direction = direction || 'do';
    
    var _applyAtomicMigration = function (statement, filename, number) {
        _client.query('BEGIN;');
        _client.query(statement, function (err, result) {
            if (err) {
                _client.end();
                var message = 'migration from ' + filename + ' failed for the following reason: ' + err.message;
                throw message;
            }
        });
        _client.query({
            text: 'insert into changelog(change_number, complete_dt, applied_by, description) values ($1, $2, $3, $4);',
            values: [number, new Date(), 'node-deploy', filename]
        }, function(){console.log('* Applied migration script:', filename)});
        _client.query('COMMIT;');
        
    }
    
    for (var filename in migrations) {
        var number = filename.match(/^\d+/)[0];
        var description = filename;
        var statement = migrations[filename][direction];
        _applyAtomicMigration(statement, filename, number);
    }
};

/**
 * Checks the existence of the changelog table. Available or not,
 * the object sends the 'ready' event, but if the table is not available,
 * the event contains an instance of Error
 **/
changelog.prototype.checkTable = function () {
    var me = this;
    _client.query('select count(tablename) from pg_tables where tablename=\'changelog\'', function(err, result) {
        if (err) {
            me.emit('error', err);
        }
        if (result.rows[0].count === 1) {
            me.emit('ready');
        } else {
            me.emit('ready', new Error('Changelog doesn\'t exist'));
        }
    });    
};

module.exports = changelog;
