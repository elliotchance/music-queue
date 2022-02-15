'use strict';

function response(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
  };
}

async function fetchJSON(s3, key) {
  const resp = await s3.getObject({
    Bucket: process.env.QUEUE_BUCKET_NAME,
    Key: key,
  }).promise();
  return JSON.parse(resp.Body.toString('utf-8'));
}

module.exports = {
  queueNames: ['beatport-artists', 'discogs-artists'],
  response,
  fetchJSON,
};
