'use strict';

const Async = require('async');
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

// Measure time between message published to SNS and time invoked on lambda
function main(event, context) {
  let invoked = new Date();

  let stats = event.Records.map((record) => {
    console.log(JSON.stringify(record, null, 2));

    let src = record.EventSource;

    // Known event sources:
    // aws:sns => sns
    // aws:kinesis => kinesis
    let created = new Date((src.indexOf('sns') >= 0) ? record.Sns.Message : record.kinesis.data);

    let latency = created.getUTCMilliseconds() - invoked.getUTCMilliseconds();

    console.log(
      'Received event from '+src+
      ' created at '+created.toString()+
      ' invoked at '+invoked.toString()+
      ' with latency '+latency+"ms"
    );

    return [src, created, invoked, latency];
  });

  context.succeed();
}

exports.handler = main;
