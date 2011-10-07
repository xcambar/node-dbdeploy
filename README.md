# What is it ?

A data migration tool entirely written in Node.js
Google dbdeploy if you don't know what data migration is.
It's the little brother of dbdeploy in Node.js

# Requirements

* Data migration files (SQL) named as follows: {digit}-{description}.sql (eg, 0001-initial_build.sql)
* A working DB with credentials to create table in it.
* Commander for the CLI script. But you can built your very own project-specific script in seconds and in a matter of 3 lines of code

# Features

* Applies only what needs to be applied (doesn't run the whole DB creation scenario every time): Hey, It's a DB _migration_ tool, remember ? ;)
* Unlike dbdeploy, the UNDO section is not mandatory
* Migrations are run as transactions, so you can not be left in an unstable state

# Examples

### From the CLI

```
dbdeploy -U username -P password --db database_name_ -f ./myMigrationsFolder/
```

### Programmatically

```javascript
var deploy = require('deploy');
deploy.config({migrationFolder: './myCustomMigrationFolder'});
deploy.run();
```

# Planned enhancements

* Downgrade is not yet fully functional
* Fixture files not reay yet

# Caveats

* Only works with node-postgres for now

# License

See LICENSE file at the root of the repository. In 3 letters: MIT
