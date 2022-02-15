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

  // Find the latest number. There is a very small chance that two request
  // happening at the same time will get the same number. That's OK, it's rare
  // enough and even when handled twice it will still only result in one
  // completed object.
  //
  // TODO(elliotchance): Right now this expects info.json to exist and will not
  //  create it. It must be created manually before this queue will start to
  //  work.
  const queueInfoKey = `queue/${queueName}/info.json`;
  const queueInfo = await fetchJSON(s3, queueInfoKey);

  // Build the response.
  const nextID = queueInfo['nextID'];
  const resp = {
    id: nextID,
    externalURL: queueInfo.externalURL.replace('${id}', nextID),
  };

  // Queue the pending item and update the meta data.
  ++queueInfo['nextID'];
  await Promise.all([
    s3.putObject({
      Bucket: process.env.QUEUE_BUCKET_NAME,
      Key: queueInfoKey,
      Body: JSON.stringify(queueInfo),
    }).promise(),
    s3.putObject({
      Bucket: process.env.QUEUE_BUCKET_NAME,
      Key: `queue/${queueName}/undecided/${nextID}.json`,
      Body: JSON.stringify({}),
    }).promise(),
  ]);

  return response(200, resp);
};
