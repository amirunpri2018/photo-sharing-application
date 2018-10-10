'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$resource',
function ($scope, $routeParams, $resource) {
  /*
  * Since the route is specified as '/users/:userId' in $routeProvider config the
  * $routeParams  should have the userId property set with the path from the URL.
  */
  var userId = $routeParams.userId;

  $scope.userDetail = {};

  var userRes = $resource('/user/:id');
  var userModel = userRes.get({id: userId}, function () {
    $scope.userDetail.user = userModel;
    $scope.main.context = 'Profile of ' + userModel.first_name + ' ' + userModel.last_name;
  }, function errorHandling(err) {
    console.log(err);
  });

  var updateNewestPhoto = function() {
    var newestPhotoRes = $resource('/user/photos/newest/:id');
    var newestPhotoModel = newestPhotoRes.get({id: userId}, function () {
      if (!newestPhotoModel._id) { // Returned object is empty
        $scope.userDetail.newestPhoto = null;
        return;
      }
      $scope.userDetail.newestPhoto = newestPhotoModel;
    }, function errorHandling(err) {
      console.log(err);
    });
  };
  updateNewestPhoto();
  $scope.$on('photoAdded', updateNewestPhoto);

  var mostCommentedPhotoRes = $resource('/user/photos/mostCommented/:id');
  var mostCommentedPhotoModel = mostCommentedPhotoRes.get({id: userId}, function () {
    if (!mostCommentedPhotoModel._id) { // Returned object is empty
      $scope.userDetail.mostCommentedPhoto = null;
      return;
    }
    $scope.userDetail.mostCommentedPhoto = mostCommentedPhotoModel;
    $scope.userDetail.mostCommentedPhoto.numComments = $scope.userDetail.mostCommentedPhoto.comments.length;
  }, function errorHandling(err) {
    console.log(err);
  });
}]);
