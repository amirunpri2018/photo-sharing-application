'use strict';

cs142App.controller('UserPhotosController', [
  '$scope',
  '$routeParams',
  '$resource',
  'FavoritesService',
  'LikeService',
  'ToastService',
function($scope, $routeParams, $resource, favoritesService, likeService, toast) {
  /*
  * Since the route is specified as '/photos/:userId' in $routeProvider config the
  * $routeParams  should have the userId property set with the path from the URL.
  */
  var userId = $routeParams.userId;

  $scope.userPhotos = {};

  $scope.userPhotos.addComment = function(photo) {
    var commentRes = $resource('/commentsOfPhoto/' + photo._id);
    var response = commentRes.save({comment: photo.newCommentText}, function() {
      $scope.userPhotos.photos = $scope.userPhotos.photos.map(function(userPhoto) {
        if (userPhoto._id === response._id) {
          userPhoto.comments = response.comments;
        }
        return userPhoto;
      });
      photo.newCommentText = '';
    }, function errorHandling(err) {
      console.log(err);
    });
  };

  var handleEvent = function(callback) {
    return function(photoId) {
      callback(photoId).then(toast).then(refreshPhotos).catch(toast);
    };
  };

  $scope.userPhotos.like = handleEvent(likeService.like);
  $scope.userPhotos.dislike = handleEvent(likeService.dislike);
  $scope.userPhotos.favorite = handleEvent(favoritesService.favorite);
  $scope.userPhotos.unfavorite = handleEvent(favoritesService.unfavorite);

  var refreshPhotos = function() {
    var photoRes = $resource('/photosOfUser/:id');
    var photoModel = photoRes.query({id: userId}, function () {
      $scope.userPhotos.photos = photoModel;
    }, function errorHandling(err) {
      console.log(err);
    });
  };

  var updateContext = function() {
    var userRes = $resource('/user/:id');
    var userModel = userRes.get({id: userId}, function () {
      $scope.userPhotos.user = userModel;
      $scope.main.context = 'Photos of ' + userModel.first_name + ' ' + userModel.last_name;
    }, function errorHandling(err) {
      console.log(err);
    });
  };

  refreshPhotos();
  updateContext();
  $scope.$on('photoAdded', refreshPhotos);
}]);
