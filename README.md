# What is it ?

A data migration tool entirely written in Node.js, inspired by [dbdeploy](http://dbdeploy.com)

It's the little brother of dbdeploy, in pure Javascript.

From the dbdeploy website, the project is described as :

> dbdeploy is a Database Change Management tool. It’s for developers or
> DBAs who want to evolve their database design – or refactor their
> database – in a simple, controlled, flexible and frequent manner.

> Manages the deployment of numbered change scripts to a SQL database, using a simple table in the database to track applied changes.


# Requirements

* Data migration files (SQL) named as follows: {digit}-{description}.sql (eg, 0001-initial_build.sql)
* A working DB with credentials to create table in it.
* [Commander](https://github.com/visionmedia/commander) for the CLI script. But you can built your very own project-specific script in seconds and in a matter of 3 lines of code

# Features

* Applies only what needs to be applied (doesn't run the whole DB creation scenario every time): Hey, It's a DB _migration_ tool, remember ? ;)
* Fine-grained control of the state of your DB
* Unlike dbdeploy, the UNDO section is not mandatory
* Migrations are run as transactions, so you can not be left in an unstable state

# Installation

* Clone the github repository
* or for easier installation, use npm:

```
npm install dbdeploy
```

# Examples

### From the CLI

_Note_: In order to run the CLI script, your PATH must contain ./node_modules/db-deploy/bin or you'll have to point directly to the script from the root of your project

```
dbdeploy -U username -P password --db database_name -f ./myMigrationsFolder/
```

To get a list of available options, simply run:

```
dbdeploy --help
```


### Programmatically

```javascript
var deploy = require('deploy');
deploy.config({migrationFolder: './myCustomMigrationFolder'});
deploy.run();
```

# Planned enhancements

* Downgrade is not yet fully functional
* Including or excluding data fixtures by deploying a superset of dmigration scripts

# Caveats

* Only works with node-postgres for now

# License

See LICENSE file at the root of the repository. In 3 letters: MIT
