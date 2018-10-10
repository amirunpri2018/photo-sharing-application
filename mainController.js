'use strict';

var cs142App = angular.module('cs142App', [
  'ngRoute',
  'ngMaterial',
  'ngResource',
  'favoritesService',
  'toastService',
  'likeService',
]);

cs142App.config(['$routeProvider',
function($routeProvider) {
  $routeProvider.
  when('/users', {
    templateUrl: 'components/user-list/user-listTemplate.html',
    controller: 'UserListController'
  }).
  when('/users/:userId', {
    templateUrl: 'components/user-detail/user-detailTemplate.html',
    controller: 'UserDetailController'
  }).
  when('/photos/:userId', {
    templateUrl: 'components/user-photos/user-photosTemplate.html',
    controller: 'UserPhotosController'
  }).
  when('/login-register', {
    templateUrl: 'components/login-register/login-registerTemplate.html',
    controller: 'LoginRegisterController'
  }).
  when('/favorites', {
    templateUrl: 'components/favorites/favoritesTemplate.html',
    controller: 'FavoritesController'
  }).
  otherwise({
    redirectTo: '/users'
  });
}]);

cs142App.controller('MainController', 
  ['$scope',
  '$resource',
  '$rootScope',
  '$location',
  '$http',
  '$mdToast',
  function ($scope, $resource, $rootScope, $location, $http, $mdToast) {
    $scope.main = {};
    $scope.main.title = 'Users';
    $scope.main.context = '';
    $scope.main.version = '';
    $scope.main.currentUser = null;


    // Called on file selection - we simply save a reference to the file in selectedPhotoFile
    $scope.uploadPhoto = function (element) {
      var selectedPhotoFile = element.files[0];

      // Create a DOM form and add the file to it under the name uploadedphoto
      var domForm = new FormData();
      domForm.append('uploadedphoto', selectedPhotoFile);

      // Using $http to POST the form
      $http.post('/photos/new', domForm, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      }).then(function successCallback(response){
        // The photo was successfully uploaded. XXX - Do whatever you want on success.
        $rootScope.$broadcast('photoAdded');
        $mdToast.show(
          $mdToast.simple()
          .textContent('Photo added successfully!')
          .capsule(true)
          .position('bottom right')
          .hideDelay(8000)
        );
      }, function errorCallback(response){
        // Couldn't upload the photo. XXX  - Do whatever you want on failure.
        console.error('ERROR uploading photo', response);
      });
    };

    var updateVersion = function() {
      var testRes = $resource('/test/info');
      var infoModel = testRes.get({}, function () {
        $scope.main.version = infoModel.__v;
      }, function errorHandling(err) {
        console.log('Error accessing the version number.');
      });
    };

    var setUser = function(userObj) {
      $scope.main.currentUser = userObj;
      $rootScope.$broadcast('userUpdated');
      updateVersion();
    };

    $scope.main.setUser = setUser;

    $scope.main.logout = function () {
      var logoutRef = $resource('/admin/logout');
      logoutRef.save({}, function () {
        setUser(null);
        $location.path("/login-register");
      }, function(err) {
        console.log(err);
        $location.path("/login-register");
      });
    };

    $rootScope.$on( "$routeChangeStart", function(event, next, current) {
      var goToLoginPage = function() {
        if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
          $location.path("/login-register");
        }
      };

      var userRef = $resource('/currentUser');
      var userModel = userRef.get(function () {
        if (userModel._id === undefined) {
          setUser(null);
          goToLoginPage();
        } else {
          setUser(userModel);
        }
      }, function errorHandling(err) {
        console.log(err);
        goToLoginPage();
      });
    });
  }]);
