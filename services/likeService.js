'use strict';

angular.module('likeService', [])
    .service('LikeService', ['$resource', 'ToastService', function($resource, toast) {       
        var dislike = function(photoId, onComplete) {
           return new Promise(function(resolve, reject) {
                var unfavorRes = $resource('/user/photos/removeLike/' + photoId);
                var response = unfavorRes.save({}, function () {
                    resolve('Photo disliked');
                }, function errorHandling(err) {
                    reject('Server Failure disliking photo :(');
                });
           });
        };

        var like = function(photoId, onComplete) {
            return new Promise(function(resolve, reject) {
                var favorRes = $resource('/user/photos/addLike/' + photoId);
                var response = favorRes.save({}, function() {
                    resolve('Photo liked!');
                }, function errorHandline(err) {
                    reject('Server Failure liking photo :(');
                });
            });
        };

        return {
            like: like,
            dislike: dislike,
        };
    }]);
