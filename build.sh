#! /bin/sh

if [ "$#" -ne 1 ];
then
  echo "$0 function_name"
  echo "   function_name - lambda function name subscribed to sns topic and kinesis stream"
  exit 1
fi

rm sns_kinesis.zip
zip -r sns_kinesis.zip index.js package.json node_modules --exclude=node_modules/aws-sdk/*
aws lambda update-function-code --function-name $1 --zip-file fileb://sns_kinesis.zip