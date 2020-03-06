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
  });
  callback(null, {
    statusCode: 200,
    body: "Ok"
  });
};

module.exports.getPlaylist = async event => {
  await ddb.scan({
    TableName: 'users'
  }, error => {
    if (error) {
      callback(null, {
        statusCode: 400,
        body: "Failed"
      });
    }
  });
  callback(null, {
    statusCode: 200,
    body: "Ok"
  });
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
    });
  }
  callback(null, {
    statusCode: 200,
    body: "Ok"
  });
};
