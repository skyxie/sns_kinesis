# sns_kinesis

Lambda function to measure latency between request and lambda function invocation.
Sends measurements to custom metric in Cloudwatch.

## Pre-requisites

1. aws-cli must be installed
2. aws credentials are expected to be installed in default path
3. node installed (duh)
4. npm installed (duh)
5. lambda function triggered by sns topic and kinesis stream

## Setup

1. `npm install` install node modules
2. Run `./build.sh <function_name>` to upload lambda function

## Test

* `./test.js` to test lambda function locally with stubbed requests uploaded to Cloudwatch.
* `./test.sh <topic> <stream> <num> <wait>` to send <num> requests (waiting <wait>s betweeen each request) to sns <topic> and kinesis <stream> to invoke lambda function.
