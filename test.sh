#!/bin/bash

npx mongodb-anonymizer \
  --uri='mongodb://root:example@localhost:27017/test?authSource=admin' \
  --targetUri='mongodb://root:example@localhost:27017/test_anon?authSource=admin' \
  --list=uniqueIdentifier:faker.string.uuid,firstName:faker.person.firstName,lastName:faker.person.lastName,sex:faker.person.sex,email:faker.internet.email,phone:faker.phone.number,dateOfBirth:faker.date.birthdate,jobTitle:faker.person.jobTitle