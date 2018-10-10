'use strict';

/* jshint node: true */

/**
* This builds on the webServer of previous projects in that it exports the current
* directory via webserver listening on a hard code (see portno below) port. It also
* establishes a connection to the MongoDB named 'cs142project6'.
*
* To start the webserver run the command:
*    node webServer.js
*
* Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
* to the current user in the current directory or any of its children.
*
* This webServer exports the following URLs:
* /                                     -  Returns a text status message.
* /test                                 -  Same as /test/info.
* /test/info                            -  Returns the SchemaInfo object from the database (JSON format).
* /test/counts                          -  Returns the population counts of the cs142 collections in the database.
*                                          Format is a JSON object with properties being the collection name and
*                                          the values being the counts.
* /currentUser                          -  Returns the User object of the current session.
* /admin/login                          -  Sets the session if the provided login_name and password are a valid
*                                          combination. Returns the user object of the new session.
* /admin/logout                         -  Destroys the current session if there is one.
* /user                                 -  Creates a new user object and logs the user in.
* /user/list                            -  Return the ID, first name, and last name of all users.
* /user/:id                             -  Return the _id, first_name, last_name, location, occupation, and description
*                                          for user with the given ID.
* /photos/likeCount/:photo_id           -  Returns the number of users who have liked the photo with the given ID.
* /photosOfUser/:id                     -  Return the Photos for user with the given ID. Includes the Boolean properties
*                                          'favorited' and 'liked' indicating whether the user with the current session
*                                          has favorited or liked them. Also includes property 'numLikes', which is the
*                                          total number of users who have liked the photo.
* /user/photos/newest/:id               -  Return the most recently added photo for the user with the given ID.
* /user/photos/mostCommented/:id        -  Return the photo with the most comments for the user with the given ID.
* /user/photos/favorites                -  Returns all the photos that the user has favorited. Includes the Boolean properties
*                                          'favorited' and 'liked' indicating whether the user with the current session
*                                          has favorited or liked them. Also includes property 'numLikes', which is the
*                                          total number of users who have liked the photo.
* /user/photos/addFavorite/:photo_id    -  Adds a photo to the current user's favorites.
* /user/photos/removeFavorite/:photo_id -  Removes a photo from the current user's favorites.
* /user/photos/addLike/:photo_id        -  Adds a like to a photo from the current user.
* /user/photos/removeLike/:photo_id     -  Removes a like from a photo from the current user.
* /commentsOfPhoto/:photo_id            -  Adds a new comment to the photo with the given ID.
* /photos/new                           -  Creates a new photo object belonging to the user who is currently logged in.
*/
var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// Load the Mongoose schemas
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');
var Favorite = require('./schema/favorite.js');
var Like = require('./schema/like.js');
var express = require('express');

var app = express();

mongoose.connect('mongodb://localhost/cs142project6');

app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
  response.send('Simple web server of files from ' + __dirname);
});

/**
* Use express to handle argument passing in the URL.  This .get will cause express
* To accept URLs with /test/<something> and return the something in request.params.p1
* If implement the get as follows:
* /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
*                       is good for testing connectivity with  MongoDB.
* /test/counts - Return an object with the counts of the different collections in JSON format
*/
app.get('/test/:p1', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  // Express parses the ":p1" from the URL and returns it in the request.params objects.
  var param = request.params.p1 || 'info';

  if (param === 'info') {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
    SchemaInfo.find({}, function(err, info) {
      if (err) {
        response.status(500).send(err);
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object - This
        // is also an internal error return.
        response.status(500).send('Missing SchemaInfo');
      }

      // We got the object - return it in JSON format.
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === 'counts') {
    // In order to return the counts of all the collections we need to do an async
    // call to each collections. That is tricky to do so we use the async package
    // do the work.  We put the collections into array and use async.each to
    // do each .count() query.
    var collections = [
      {name: 'user', collection: User},
      {name: 'photo', collection: Photo},
      {name: 'schemaInfo', collection: SchemaInfo}
    ];
    async.each(collections, function(col, done_callback) {
      col.collection.count({}, function(err, count) {
        col.count = count;
        done_callback(err);
      });
    }, function(err) {
      if (err) {
        response.status(500).send(err);
      } else {
        var obj = {};
        for (var i = 0; i < collections.length; i++) {
          obj[collections[i].name] = collections[i].count;
        }
        response.end(JSON.stringify(obj));

      }
    });
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400) status.
    response.status(400).send('Bad param ' + param);
  }
});

/**
* /currentUser - Returns the User object of the current session. Could be undefined or null.
*/
app.get('/currentUser', function(request, response) {
  response.end(JSON.stringify(request.session.user));
});

/**
* /admin/login - Sets the session if the login_name and password are correct.
*/
app.post('/admin/login', function(request, response) {
  var loginName = request.body.login_name;
  var password = request.body.password;

  User.findOne({login_name: loginName, password: password}, function(err, user) {
    if (err) {
      response.status(500).send(err);
    }

    if (user === null) {
      response.status(400).send('Login name and password combination is invalid.');
    }

    request.session.user = user;
    response.end(JSON.stringify(user));
  });
});

/**
* /admin/logout - Clears the current user session if there is one.
*/
app.post('/admin/logout', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(400).send('No user is currently logged in.');
  }

  request.session.destroy(function(err) {
    if (err) {
      response.status(500).send(err);
    }
  });

  response.end();
});

/**
* /user - Creates a new user object and logs the user in.
*/
app.post('/user', function(request, response) {
  var loginName = request.body.login_name;
  var password = request.body.password;
  var firstName = request.body.first_name;
  var lastName = request.body.last_name;

  if (!loginName) { response.status(400).send('Login name must contain at least one character of text.'); }
  if (!password) { response.status(400).send('Password must contain at least one character of text.'); }
  if (!firstName) { response.status(400).send('First name must contain at least one character of text.'); }
  if (!lastName) { response.status(400).send('Last name must contain at least one character of text.'); }

  User.findOne({login_name: loginName}, function(err, user) {
    if (err) {
      response.status(500).send(err);
    }

    if (user) {
      response.status(400).send('User with login name "' + loginName + '" already exists. Please choose a different name.');
    }

    var newUser = new User({
      login_name: loginName,
      password: password,
      first_name: firstName,
      last_name: lastName,
      location: request.body.location || '',
      description: request.body.description || '',
      occupation: request.body.occupation || '',
    });

    newUser.save(function(err) {
      if (err) {
        response.status(500).send(err);
      }
      request.session.user = newUser;
      response.end(JSON.stringify(newUser));
    });
  });
});

/**
* /user/list - Return the ID, first name, and last name of all users.
*/
app.get('/user/list', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  User.find({}, '_id first_name last_name', function(err, users) {
    if (err) {
      response.status(500).send(err);
    }

    response.end(JSON.stringify(users)); // Note: Array might be empty if there are no users.
  });
});

/**
* /user/:id - Return the profile information for user with the given ID.
*/
app.get('/user/:id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  var userId = request.params.id;
  User.findOne({_id: userId}, '_id first_name last_name location occupation description', function(err, user) {
    if (err) {
      // Query returned an error. Assume this was caused by the caller providing an invalid ID.
      response.status(400).send('Invalid user _id:' + userId + '.');
    }

    if (user === null) {
      response.status(400).send('User with _id:' + userId + ' not found.');
    }

    response.end(JSON.stringify(user));
  });
});

/**
* Converts the dates of a photo to a readable string. Both the photo
* date_time and the date_times in the array of comments are converted.
*/
var dateToString = function(photo) {
  var dateStringFormatParams = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  photo = JSON.parse(JSON.stringify(photo));
  photo.date_time = (new Date(photo.date_time)).toLocaleDateString("en-US", dateStringFormatParams);
  photo.comments = photo.comments.map(function(comment) {
    comment.date_time = (new Date(comment.date_time)).toLocaleDateString("en-US", dateStringFormatParams);
    return comment;
  });
  return photo;
};

/**
* Queries photos of the user with the given ID and then performs some operation
* on them as specified in the callback.
*/
var processPhotosOfUser = function(request, response, processPhotoCallback) {
  var userId = request.params.id;
  Photo.find({user_id: userId}, function(err, photos) {
    if (err) {
      // Query returned an error. Assume this was caused by the caller providing an invalid ID.
      response.status(400).send('Invalid user _id:' + userId + '.');
    }

    if (photos.length === 0) {
      // We don't know if the user doesn't exist or if the user exists but doesn't have any photos.
      User.findOne({_id: userId}, function(err, user) {
        if (err) {
          // Query returned an error. Assume this was caused by the caller providing an invalid ID.
          response.status(400).send('Invalid user _id:' + userId + '.');
        }

        if (user) {
          // The user exists, they just don't have any photos, so respond with null.
          response.end(null);
        }

        // Query didn't return an error and didn't find a User object with the given ID.
        response.status(400).send('User with _id:' + userId + ' not found.');
      });
    } else {
      processPhotoCallback(photos);
    }
  });
};

/**
* /photos/likeCount/:photo_id - Returns the number of users who have liked a photo.
*/
app.get('/photos/likeCount/:photo_id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  var photoId = request.params.photo_id;
  Like.find({photo_id: photoId}, function(err, likeObjArr) {
    if (err) {
      // Query returned an error. Assume this was caused by the caller providing an invalid ID.
      response.status(400).send('Invalid photo_id:' + photoId + '.');
    }

    response.end(likeObjArr.length);
  });
});

/**
 * Returns a function that takes in a photo and returns a promise for a photo with
 * an additional property 'favorited' that indicates if the user with an active
 * session has favorited the photo (True) or not (False).
 */
var addIfFavorited = function(userId) {
  return function(photo) {
    return new Promise(function(resolve, reject) {
      Favorite.findOne({photo_id: photo._id, user_id: userId}, function(err, favoriteObj) {
        if (err) {
          reject(err);
        }
        photo.favorited = !!favoriteObj;
        resolve(photo);
      });
    });
  };
};

/**
 * Returns a function that takes in a photo and returns a promise for a photo with
 * an additional property 'liked' that indicates if the user with an active
 * session has liked the photo (True) or not (False).
 */
var addIfLiked = function(userId) {
  return function(photo) {
    return new Promise(function(resolve, reject) {
      Like.findOne({photo_id: photo._id, user_id: userId}, function(err, likeObj) {
        if (err) {
          reject(err);
        }
        photo.liked = !!likeObj;
        resolve(photo);
      });
    });
  };
};

/**
 * Returns a function that takes in a photo and returns a promise for a photo with
 * an additional property 'numLikes' - a count of the number of users who have liked
 * the photo.
 */
var addNumberLikes = function(photo) {
  return new Promise(function(resolve, reject) {
    Like.count({photo_id: photo._id}, function(err, count) {
      if(err) {
        reject(err);
      }
      photo.numLikes = count;
      resolve(photo);
    });
  });
};

/**
* Converts a comment with a user_id field into having the actual user
* object filled in to a user field.
*/
var updateComment = function(comment) {
  return new Promise(function(resolve, reject) {
    User.findOne({_id: comment.user_id}, '_id first_name last_name', function(err, user) {
      if (err) {
        reject(err);
      }
  
      var newComment = {
        comment: comment.comment,
        date_time: comment.date_time,
        _id: comment._id,
        user: user,
      };
  
      resolve(newComment);
    });
  });
};

/**
* Converts a photo object by mapping over all comments with the
* convertComment function.
*/
var updatePhotoComments = function(photo) {
  return new Promise(function(resolve, reject) {
    Promise.all(photo.comments.map(updateComment)).then(function(updatedComments) {
      resolve({
        _id: photo._id,
        user_id: photo.user_id,
        comments: updatedComments,
        file_name: photo.file_name,
        date_time: photo.date_time,
      });
    }).catch(reject);
  });
};

/**
 * Converts a photo to include user objects on its comments, a 'favorited' property,
 * a 'liked' property, and a 'numLikes' property.
 */
var updatePhoto = function(userId) {
  return function(photo) {
    return updatePhotoComments(photo)
      .then(addNumberLikes)
      .then(addIfFavorited(userId))
      .then(addIfLiked(userId));
  };
};

/**
* /photosOfUser/:id - Return the Photos for user with the given ID.
*/
app.get('/photosOfUser/:id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  processPhotosOfUser(request, response, function(photos) {
    var userId = request.session.user._id;

    Promise.all(photos.map(updatePhoto(userId))).then(function(updatedPhotos) {
      updatedPhotos.sort(function(a, b) {
        // If different number of likes, then the one with more likes comes first.
        if (a.numLikes !== b.numLikes) {
          return b.numLikes - a.numLikes;
        }

        // If same number of likes, then newest comes first.
        return (new Date(b.date_time)) - (new Date(a.date_time));
      });

      response.end(JSON.stringify(updatedPhotos.map(dateToString)));
    }).catch(function(err) {
      console.log(err);
      response.status(500).send(err);
    });
  });
});

/**
* /user/photos/newest/:id - Return the most recently added photo for the user with the given ID.
*/
app.get('/user/photos/newest/:id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  processPhotosOfUser(request, response, function(photos) {
    // Sorts so that newest photo is first
    photos.sort(function(a, b) {
      return (new Date(b.date_time)) - (new Date(a.date_time));
    });

    photos = photos.map(dateToString);
    response.end(JSON.stringify(photos[0]));
  });
});

/**
* /user/photos/mostCommented/:id - Return the photo with the most comments for the user with the given ID.
*/
app.get('/user/photos/mostCommented/:id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  processPhotosOfUser(request, response, function(photos) {
    // Sorts so that oldest photo is first. This allows us to update the current
    // most commented photo with a newer photo with the same number of comments.
    photos.sort(function(a, b) {
      return (new Date(a.date_time)) - (new Date(b.date_time));
    });

    var mostCommentedPhoto = {comments: []};
    photos.forEach(function(photo) {
      if (photo.comments.length >= mostCommentedPhoto.comments.length) {
        mostCommentedPhoto = photo;
      }
    });
    mostCommentedPhoto = dateToString(mostCommentedPhoto);
    response.end(JSON.stringify(mostCommentedPhoto));
  });
});

/**
* /user/photos/favorites - Returns the photos that the user has favorited.
*/
app.get('/user/photos/favorites', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  var userId = request.session.user;
  Favorite.find({user_id: userId}, 'photo_id', function(err, favorites) {
    if (err) {
      response.status(500).send(err);
    }

    var favoritePhotoIds = favorites.map(function(favorite) {
      return favorite.photo_id;
    });

    async.map(favoritePhotoIds, Photo.findById.bind(Photo), function(err, photos) {
      if (err) {
        response.status(500).send(err);
      }

      response.end(JSON.stringify({
        photos: photos.map(dateToString),
      }));
    });
  });
});

/**
* /user/photos/addFavorite/:photo_id - Adds a photo to the user's favorites by
* creating a new Favorite object in the database.
*/
app.post('/user/photos/addFavorite/:photo_id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  var photoId = request.params.photo_id;
  var userId = request.session.user._id;
  // Check to make sure that the user doesn't already have the photo favorited.
  // If they don't, then add the Favorite. Otherwise, do nothing.
  Favorite.findOne({photo_id: photoId, user_id: userId}, function(err, favoriteObj) {
    if (err) {
      response.status(500).send(err);
    }

    if (favoriteObj) {
      response.end();
    }

    var newFavorite = new Favorite({
      photo_id: photoId,
      user_id: userId,
    });

    newFavorite.save(function(err) {
      if (err) {
        response.status(500).send(err);
      }
      response.end();
    });
  });
});

/**
* /user/photos/removeFavorite/:photo_id - Removes a photo from the user's favorites by
* removing the corresponding Favorite object in the database.
*/
app.post('/user/photos/removeFavorite/:photo_id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  var photoId = request.params.photo_id;
  var userId = request.session.user._id;
  // Check to make sure that the user already has the photo favorited.
  // If they do, then remove the Favorite. Otherwise, do nothing.
  Favorite.findOne({photo_id: photoId, user_id: userId}, function(err, favoriteObj) {
    if (err) {
      response.status(500).send(err);
    }

    if (!favoriteObj) {
      response.end();
    }

    Favorite.remove({photo_id: photoId, user_id: userId}, function (err) {
      if (err) {
        response.status(500).send(err);
      }
      response.end();
    });
  });
});

/**
* /user/photos/addLike/:photo_id - Adds a like to a photo by creating a new
* Like object in the database.
*/
app.post('/user/photos/addLike/:photo_id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  var photoId = request.params.photo_id;
  var userId = request.session.user._id;
  // Check to make sure that the user hasn't already liked the photo.
  // If they haven't, then add the Like. Otherwise, do nothing.
  Like.findOne({photo_id: photoId, user_id: userId}, function(err, likeObj) {
    if (err) {
      response.status(500).send(err);
    }

    if (likeObj) {
      response.end();
    }

    var newLike = new Like({
      photo_id: photoId,
      user_id: userId,
    });

    newLike.save(function(err) {
      if (err) {
        response.status(500).send(err);
      }
      response.end();
    });
  });
});

/**
* /user/photos/removeLike/:photo_id - Removes a like from a photo by removing the
* corresponding Like object from the database.
*/
app.post('/user/photos/removeLike/:photo_id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  var photoId = request.params.photo_id;
  var userId = request.session.user._id;
  // Check to make sure that the user has already liked the photo.
  // If they have, then remove the Like. Otherwise, do nothing.
  Like.findOne({photo_id: photoId, user_id: userId}, function(err, likeObj) {
    if (err) {
      response.status(500).send(err);
    }

    if (!likeObj) {
      response.end();
    }

    Like.remove({photo_id: photoId, user_id: userId}, function (err) {
      if (err) {
        response.status(500).send(err);
      }
      response.end();
    });
  });
});

/**
* /commentsOfPhoto/:photo_id - Adds a new comment to the photo with the given ID.
*/
app.post('/commentsOfPhoto/:photo_id', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  var commentText = request.body.comment;
  if (commentText.length === 0) {
    response.status(400).send('Comment must contain at least one character of text.');
  }

  var photoId = request.params.photo_id;
  Photo.findById(photoId, function(err, photo) {
    if (err) {
      // Query returned an error. Assume this was caused by the caller providing an invalid ID.
      response.status(400).send('Invalid photo _id:' + photoId + '.');
    }

    if (photo === null) {
      response.status(400).send('No photo with _id:' + photoId + '.');
    }

    var newComment = {
      comment: commentText,
      user_id: request.session.user._id,
    };
    photo.comments.push(newComment);

    photo.save(function(err, updatedPhoto) {
      if (err) {
        console.log(err);
        response.status(500).send(err);
      }

      updatePhotoComments(updatedPhoto).then(function(photoWithConvertedComments) {
        photoWithConvertedComments = dateToString(photoWithConvertedComments);
        response.end(JSON.stringify(photoWithConvertedComments));
      }).catch(function(err) {
        console.log(err);
        response.status(500).send(err);
      });
    });
  });
});

/**
* /photos/new - Creates a new photo object belonging to the user who is currently
* logged in.
*/
app.post('/photos/new', function(request, response) {
  if (request.session.user === null || request.session.user === undefined) {
    response.status(401).send('You must be logged in to perform this action.');
  }

  processFormBody(request, response, function(err) {
    if (err || !request.file) {
      response.status(400).send('Problem processing image.');
    }

    if (request.file.size === 0) {
      response.status(400).send('Image had a size of 0.');
    }

    // We need to create the file in the directory "images" under an unique name. We make
    // the original file name unique by adding a unique prefix with a timestamp.
    var timestamp = new Date().valueOf();
    var filename = 'U' +  String(timestamp) + request.file.originalname;

    fs.writeFile("./images/" + filename, request.file.buffer, function(err) {
      if (err) {
        response.status(500).send('Failed writing image.');
      }

      var photo = new Photo({
        file_name: filename,
        user_id: request.session.user._id,
        comments: [],
      });
      photo.save(function(err) {
        if (err) {
          response.status(500).send(err);
        }

        response.end();
      });
    });
  });
});

var server = app.listen(3000, function() {
  var port = server.address().port;
  console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
