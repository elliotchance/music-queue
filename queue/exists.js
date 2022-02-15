'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { queueNames, response, fetchJSON } = require('./utils');

module.exports.handler = async (event) => {
  // Validation.
  const queueName = event.pathParameters.queueName;
  if (!queueNames.includes(queueName)) {
    return response(404, {
      message: `Queue does not exist: ${queueName}`,
    });
  }

  const id = event.pathParameters.id;
  if (!id.match(/^\d+$/)) {
    return response(400, {
      message: `Invalid ID: ${id}`,
    });
  }

  // Move to the exists queue and update the stats.
  const queueInfoKey = `queue/${queueName}/info.json`;
  const queueInfo = await fetchJSON(s3, queueInfoKey);

  if (id < 1 || id > queueInfo['total']) {
    return response(400, {
      message: `Invalid ID: ${id}`,
    });
  }

  ++queueInfo['exists'];
  ++queueInfo['completed'];
  --queueInfo['undecided'];

  await Promise.all([
    s3.putObject({
      Bucket: process.env.QUEUE_BUCKET_NAME,
      Key: queueInfoKey,
      Body: JSON.stringify(queueInfo),
    }).promise(),
    s3.deleteObject({
      Bucket: process.env.QUEUE_BUCKET_NAME,
      Key: `queue/${queueName}/undecided/${id}.json`,
    }).promise(),
    s3.putObject({
      Bucket: process.env.QUEUE_BUCKET_NAME,
      Key: `queue/${queueName}/exists/${id}.json`,
      Body: JSON.stringify({}),
    }).promise(),
  ]);

  return response(200, {});
};
