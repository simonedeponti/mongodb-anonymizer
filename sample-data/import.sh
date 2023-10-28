#! /bin/sh

zcat /sample-data/people.json.gz > /tmp/people.json
mongoimport --db test --collection people --type json --file /tmp/people.json