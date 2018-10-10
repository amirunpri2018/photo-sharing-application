'use strict';

/*
*  Defines the Mongoose Schema and return a Model for a Favorite on a photo.
*/
/* jshint node: true */

var mongoose = require('mongoose');

var favoriteSchema = new mongoose.Schema({
  photo_id: mongoose.Schema.Types.ObjectId,    // The ID of the photo that is favorited.
  user_id: mongoose.Schema.Types.ObjectId,    // ID of the user who favorited the photo.
});

// the schema is useless so far
// we need to create a model using it
var Favorite = mongoose.model('Favorite', favoriteSchema);

// make this available to our users in our Node applications
module.exports = Favorite;
