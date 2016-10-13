#! /bin/sh

if [ "$#" -ne 4 ];
then
  echo "$0 topic stream num wait"
  echo "   topic - sns arn topic"
  echo "   stream - kinesis steam"
  echo "   num - number of iterations"
  echo "   wait - sleep seconds between iterations"
  exit 1
fi

SNS_TOPIC=$1
KINESIS_STREAM=$2
NUM=$3
WAIT=$4

for i in $(seq 1 $NUM);
do
  MESSAGE=$(echo $(($(date '+%s%N') / 1000000)))
  echo "Created at $MESSAGE"
  aws sns publish --topic-arn $SNS_TOPIC --message $MESSAGE
  aws kinesis put-record --stream-name $KINESIS_STREAM --data $MESSAGE --partition-key 0
  sleep $WAIT
done
