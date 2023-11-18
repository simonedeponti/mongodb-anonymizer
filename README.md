mongodb-anonymizer
==================

MongoDB anonymzer tool.
Export your MongoDB database anonymized from source to target. Replace all sensitive data thanks to `faker`.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/mongodb-anonymizer.svg)](https://npmjs.org/package/mongodb-anonymizer)
[![License](https://img.shields.io/npm/l/mongodb-anonymizer.svg)](https://github.com/rap2hpoutre/mongodb-anonymizer/blob/main/package.json)

## Usage

Run this command by giving a source URI and target URI (no need to install first thanks to `npx`):

```bash
npx mongodb-anonymizer \
  --uri=mongodb://localhost:27017/source \
  --targetUri=mongodb://localhost:27017/anonymized
```

☝️ Be careful, since target collections will be removed.

### Specify list of fields to anonymize

Use `--list` option with a comma separated list of column name:

```bash
npx mongodb-anonymizer  \
  --uri=mongodb://localhost:27017/source \
  --targetUri=mongodb://localhost:27017/anonymized
  --list=email,firstName,lastName,phone
```

Specifying another list via `--list` replace the default automatically anonymized values:

```csv
email,name,description,address,city,country,phone,comment,birthdate
```

You can also specify replacements for a specific collection:

```csv
users.email,products.price
```

#### Customize replacements 

You can also choose which faker function you want to use to replace data (default is `faker.random.word`):

```bash
npx mongodb-anonymizer  \
  --uri=mongodb://localhost:27017/source \
  --targetUri=mongodb://localhost:27017/anonymized
  --list=firstName:faker.name.firstName,lastName:faker.name.lastName
```

:point_right: You don't need to specify faker function since the command will try to find correct function via column name.

You can use plain text too for static replacements:
```bash
npx mongodb-anonymizer  \
  --uri=mongodb://localhost:27017/source \
  --targetUri=mongodb://localhost:27017/anonymized
  --list=textcol:hello,jsoncol:{},intcol:12
```

You can also anonymize nested fields by using a dot notation
(you'll be forced to specify them per collection as the first will be the collection):
```bash
npx mongodb-anonymizer  \
  --uri=mongodb://localhost:27017/source \
  --targetUri=mongodb://localhost:27017/anonymized
  --list=mycoll.nested.field:hello,mycoll.nested.intcol:12
```

## Test

Run `docker-compose up -d`, then run `./test.sh`