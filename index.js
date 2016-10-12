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

exports.handler = (event, context, callback) => {
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
};
