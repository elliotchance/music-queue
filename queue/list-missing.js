'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { queueNames, response, fetchJSON } = require('./utils');

// Example:
// curl "https://oop91rp1wk.execute-api.us-east-1.amazonaws.com/production/queue/beatport-artists/missing"

module.exports.handler = async (event) => {
  // Validation.
  const queueName = event.pathParameters.queueName;
  if (!queueNames.includes(queueName)) {
    return response(404, {
      message: `Queue does not exist: ${queueName}`,
    });
  }

  const queueInfoKey = `queue/${queueName}/info.json`;
  const queueInfo = await fetchJSON(s3, queueInfoKey);

  const resp = await s3.listObjectsV2({
    Bucket: process.env.QUEUE_BUCKET_NAME,
    Prefix: `queue/${queueName}/missing/`,
  }).promise();

  let items = [];
  for (const obj of resp.Contents) {
    const id = obj.Key.match(/(\d+)\.json$/)[1];
    const externalURL = queueInfo['externalURL'].replace('${id}', id);
    items.push({
      id,
      externalURL,
    });
  }

  return response(200, {
    items,
  });
};
