'use strict';

angular.module('favoritesService', [])
    .service('FavoritesService', ['$resource', function($resource) {
        var loadFavoritePhotos = function(onLoad) {
            return new Promise(function(resolve, reject) {
                var favoritesRes = $resource('/user/photos/favorites');
                var favoritesModel = favoritesRes.get({}, function () {
                    resolve(favoritesModel.photos);
                }, function errorHandling(err) {
                    reject('Server Failure finding your favorites photos :(');
                });
            });
        };
        
        var unfavorite = function(photoId, onComplete) {
            return new Promise(function(resolve, reject) {
                var unfavorRes = $resource('/user/photos/removeFavorite/' + photoId);
                var response = unfavorRes.save({}, function () {
                    resolve('Photo removed from favorites!');
                }, function errorHandling(err) {
                    reject('Server Failure removing photo from favorites :(');
                });
            });
        };

        var favorite = function(photoId, onComplete) {
            return new Promise(function(resolve, reject) {
                var favorRes = $resource('/user/photos/addFavorite/' + photoId);
                var response = favorRes.save({}, function() {
                    resolve('Photo added to favorites!');
                }, function errorHandline(err) {
                    reject('Server Failure adding photo to favorites :(');
                });
            });
        };

        return {
            loadFavoritePhotos: loadFavoritePhotos,
            unfavorite: unfavorite,
            favorite: favorite,
        };
    }]);
