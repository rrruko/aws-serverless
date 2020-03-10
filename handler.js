'use strict';

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.saveUser = async (event, context, callback) => {
  let params = {
    TableName: 'users',
    Item: {
      'PK': event.id,
      'SK': event.email
    }
  };
  await ddb.put(params, error => {
    if (error) {
      console.log(error)
      callback(null, {
        statusCode: 400,
        body: "Failed"
      });
    }
  }).promise();
  callback(null, {
    statusCode: 200,
    body: "Ok"
  });
};

module.exports.getPlaylist = async (event, context, callback) => {
  let playlistId = event.pathParameters.id;
  let res = await ddb.scan({
    TableName: 'users',
    FilterExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": playlistId
    }
  }, (error, data) => {
    if (error) {
      callback(null, {
        statusCode: 400,
        body: "Failed"
      });
    }
    if (data) {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      });
    }
  }).promise();
};

module.exports.postPlaylist = async (event, context, callback) => {
  if (!event.userId) {
    callback(null, {
      statusCode: 400,
      body: "No user id supplied"
    });
  }
  for (let songId of event.songs) {
    let params = {
      TableName: 'users',
      Item: {
        'PK': `playlist_${event.userId}`,
        'SK': songId
      }
    };
    await ddb.put(params, error => {
      if (error) {
        console.log(error);
        callback(null, {
          statusCode: 400,
          body: "Failed"
        });
      }
    }).promise();
  }
  callback(null, {
    statusCode: 200,
    body: "Ok"
  });
};

module.exports.play = async (event, context, callback) => {
  let artist = event.artist;
  let album = event.album;
  let song = event.song;
  if (!artist || !album || !song) {
    callback(null, {
      statusCode: 400,
      body: "Missing parameters"
    });
  }
  let sqs = new AWS.SQS({});
  await sqs.sendMessage({
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/195191189173/reporting.fifo',
    MessageAttributes: {
      "artist": { DataType: "String", StringValue: artist },
      "album": { DataType: "String", StringValue: album },
      "song": { DataType: "String", StringValue: song }
    },
    MessageBody: "Song played",
    MessageDeduplicationId: Date.now().toString(),
    MessageGroupId: "reporting"
  }, (error, data) => {
    if (data) {
      callback(null, {
        statusCode: 200,
        body: `Ok (${data})`
      });
    } else if (error) {
      callback(null, {
        statusCode: 400,
        body: `Error (${error})`
      });
    } else {
      callback(null, {
        statusCode: 200,
        body: `No response from sqs`
      });
    }
  }).promise();
};
