'use strict';

cs142App.controller('FavoritesController', ['$scope', '$resource', '$mdDialog', 'FavoritesService',
function($scope, $resource, $mdDialog, favoritesService) {
  $scope.favorites = {
    photos: [],
    selectedPhoto: null,
    isLoading: true,
  };

  $scope.favorites.unfavorite = function(photo_id) {
    favoritesService.unfavorite(photo_id).then(loadPhotos).catch(console.log.bind(this));
  };

  $scope.favorites.openModal = function(photo) {
    $scope.favorites.selectedPhoto = photo;

    $mdDialog.show({
      contentElement: '#photoModal',
      parent: angular.element(document.body),
      clickOutsideToClose: true
    });
  };

  var loadPhotos = function() {
    favoritesService.loadFavoritePhotos().then(function(photos) {
      $scope.favorites.photos = photos;
      $scope.favorites.isLoading = false;
      $scope.$apply();
    }).catch(console.log.bind(this));
  };
  loadPhotos();
}]);
