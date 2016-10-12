#! /bin/sh

rm sns_kinesis.zip
zip -r sns_kinesis.zip index.js package.json node_modules --exclude=node_modules/aws-sdk/*
aws lambda update-function-code --function-name sns_test --zip-file fileb://sns_kinesis.zip