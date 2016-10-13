'use strict';

const async = require('async');
const AWS = require('aws-sdk');

function _write(kinesis, record, callback) {
  let id = record.Sns.MessageId;
  let data = JSON.stringify(record.Sns, null, 2);

  var recordParams = {
    Data : data,
    PartitionKey : id,
    StreamName : 'test'
  };

  console.log(data);

  kinesis.putRecord(recordParams, function(err, data) {
    if (err) {
      console.log('ERROR: '+err);
      callback(err);
    } else {
      console.log('Successfully sent data to Kinesis.');
      console.log(data);
      callback();
    }
  });
}

// Sends SNS messages to Kinesis
function snsKinesis(event, context) {
  const kinesis = new AWS.Kinesis({region : 'us-east-1'});

  Async.parallel(
    // Create a task for each record
    event.Records.map((record) => {
      // Write each record to kinesis
      return (recordCb) => _write(kinesis, record, recordCb);
    }),
    (err, result) => {
      if (err) {
        context.fail(err);
      } else {
        context.succeed();
      }
    }
  );
}

// Creates AWS Cloudwatch metrics
function createMetricTask(cloudwatch, stats) {
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

  return  function _createMetric(callback) {
    cloudwatch.putMetricData(params, (err, result) => {
      if (err) {
        console.log('Failed to record stats: '+JSON.stringify(params, null, 2)+' because of error: '+err);
      } else {
        console.log('Successfully recorded stats: '+JSON.stringify(params, null, 2));
      }
      // Do not error on failure to record stats;
      callback(null, result);
    });
  };
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

  return {source: src, created_at: created, invoked_at: invoked, latency: latency};
}

// Measure time between message published to SNS and time invoked on lambda
function main(event, context, callback) {
  let invoked = new Date();
  let cloudwatch = new AWS.CloudWatch();
  let tasks = event.Records.map(function _recordIterator(record, index) {
                return createMetricTask(cloudwatch, recordMetric(invoked, record));
              });

  async.parallel(tasks, (err, results) => {
    // Always call with success
    context.succeed();
    callback();
  });
}

exports.handler = main;
