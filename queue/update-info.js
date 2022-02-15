'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { queueNames, response, fetchJSON } = require('./utils');

// To update the size of a queue:
// curl -X PUT -H "Content-Type: application/json" -d '{"total":1009999}' "https://oop91rp1wk.execute-api.us-east-1.amazonaws.com/production/queue/beatport-artists/info"

module.exports.handler = async (event) => {
  // Since there is no protection on this endpoint, it's disabled. I'll put in
  // better authentication later.
  return response(403, {
    message: `Admin only`,
  });

  // Validation.
  const queueName = event.pathParameters.queueName;
  if (!queueNames.includes(queueName)) {
    return response(404, {
      message: `Queue does not exist: ${queueName}`,
    });
  }


  // Update info.
  const queueInfoKey = `queue/${queueName}/info.json`;
  const queueInfo = await fetchJSON(s3, queueInfoKey);

  const body = JSON.parse(event.body);
  for (const key in body) {
    queueInfo[key] = body[key];
  }

  // Might need to correct for the undecided.
  queueInfo['undecided'] = queueInfo['total'] - queueInfo['completed'];

  await s3.putObject({
    Bucket: process.env.QUEUE_BUCKET_NAME,
    Key: queueInfoKey,
    Body: JSON.stringify(queueInfo),
  }).promise();

  return response(200, queueInfo);
};
