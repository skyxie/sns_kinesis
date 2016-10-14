'use strict';

const Promise = require('promise');
const AWS = require('aws-sdk');

// Creates AWS Cloudwatch metrics
function createMetricPromise(cloudwatch, stats) {
  let params = {
    MetricData: [
      {
        MetricName: 'InvocationLatency',
        Dimensions: [{Name: 'Source', Value: stats.source}],
        Timestamp: stats.invoked_at,
        Unit: 'Milliseconds',
        Value: stats.latency
      },
    ],
    Namespace: 'Lambda'
  };

  let promise = new Promise(function _putMetric(fulfill, reject) {
    cloudwatch.putMetricData(params, function _putMetricCb(err, result) {
      if (err) {
        console.log('Failed to record stats: '+JSON.stringify(params, null, 2)+' because of error: '+err);
        reject(err);
      } else {
        console.log('Successfully recorded stats: '+JSON.stringify(params, null, 2));
        fulfill(result);
      }
    });
  });

  return promise;
}

function recordMetric(invoked, record) {
  console.log(JSON.stringify(record, null, 2));

  let invokedTimestamp = invoked.getTime();
  var timestamp = "", src = "";

  // Known event sources:
  // EventSource: "aws:sns" => sns
  // eventSource: "aws:kinesis" => kinesis
  if (record.EventSource === 'aws:sns') {
    timestamp = record.Sns.Message;
    src = 'sns';
  } else {
    timestamp = new Buffer(record.kinesis.data, 'base64').toString('ascii');
    src = 'kinesis';
  }
  let createdTimestamp = parseInt(timestamp);
  let created = new Date(createdTimestamp);
  let latency = invokedTimestamp - createdTimestamp;

  console.log(
    'Received event from '+src+
    ' created at '+created.toString()+
    ' invoked at '+invoked.toString()+
    ' with latency '+latency+"ms"
  );

  return {
    source: src,
    created_at: created,
    invoked_at: invoked,
    latency: latency
  };
}

// Measure time between message published to SNS and time invoked on lambda
function main(event, context, callback) {
  let invoked = new Date();
  let cloudwatch = new AWS.CloudWatch();

  Promise.all(event.Records.map(function _recordIterator(record) {
    return createMetricPromise(cloudwatch, recordMetric(invoked, record));
  })).done(
    function _success(results) {
      console.log("Invocation latency metric logging successful");
      context.succeed();
    },
    function _failure(err) {
      console.log("Invocation latency metric logging failed");
      context.fail();
    }
  );
}

exports.handler = main;
