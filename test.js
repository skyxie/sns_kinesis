#!/usr/bin/env node

'use strict';

const AWS = require('aws-sdk');
const f = require('./index');

AWS.config.update({region: 'us-west-1'});

let timestamp = (new Date(2016, 9, 13, 1, 2, 3)).getTime().toString();

let message = {
  "Records": [
    {
      "EventSource" : "aws:sns",
      "Sns": {
        "Message": timestamp
      }
    },
    {
      "eventSource" : "aws:kinesis",
      "kinesis" : {
        "data" : new Buffer(timestamp, 'ascii').toString('base64')
      }
    }
  ]
};

let context = {
  fail : function _fail(message) {
    console.log("FAILURE: "+message);
  },
  succeed : function _succeed() {
    console.log("SUCCESS");
  }
};

f.handler(message, context);
