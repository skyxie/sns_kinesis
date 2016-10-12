
'use strict';

const aws = require('aws-sdk');
const f = require('./index');

let message = {
  "Records": [
    {
      "Sns": {
        "Type": "Notification",
        "MessageId": "123456",
        "Subject": "subject",
        "Message": "payload lives here",
        "Timestamp": "2016-09-18T22:26:02.419Z",
        "MessageAttributes": {}
      }
    }
  ]
}

let context = {
  fail : function _fail(message) {
    console.log("FAILURE: "+message);
  },
  succeed : function _succeed() {
    console.log("SUCCESS");
  }
};

f.handler(message, context);
