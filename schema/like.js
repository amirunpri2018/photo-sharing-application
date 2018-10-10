'use strict';

/*
*  Defines the Mongoose Schema and return a Model for a Like on a photo.
*/
/* jshint node: true */

var mongoose = require('mongoose');

var likeSchema = new mongoose.Schema({
  photo_id: mongoose.Schema.Types.ObjectId,    // The ID of the photo that is liked.
  user_id: mongoose.Schema.Types.ObjectId,    // ID of the user who liked the photo.
});

// the schema is useless so far
// we need to create a model using it
var Like = mongoose.model('Like', likeSchema);

// make this available to our users in our Node applications
module.exports = Like;
