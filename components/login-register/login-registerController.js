'use strict';

cs142App.controller('LoginRegisterController', ['$scope', '$resource', '$location', 'ToastService',
function ($scope, $resource, $location, toast) {

  $scope.main.context = 'Please Login';

  $scope.loginRegister = {};

  $scope.loginRegister.StateEnum = {
    LOGIN: 1,
    REGISTER: 2,
  };
  $scope.loginRegister.currentState = $scope.loginRegister.StateEnum.LOGIN;

  $scope.loginRegister.login = function() {
    var loginRes = $resource('/admin/login');
    var payload = {
      login_name: $scope.loginRegister.loginName,
      password: $scope.loginRegister.password,
    };
    var userModel = loginRes.save(payload, function () {
      $scope.main.setUser(userModel);
      $location.path('/users/' + $scope.main.currentUser._id);
    }, function errorHandling(err) {
      var errMsg = 'No user with login name "' + $scope.loginRegister.loginName + '" and the given password could be found.' + ' Please try again with different credentials.';
      toast(errMsg);
    });
  };

  $scope.loginRegister.register = function() {
    // Check that the passwords match
    if ($scope.loginRegister.newPassword !== $scope.loginRegister.newPasswordRepeat) {
      toast('Password fields must match. Please try again.');
      return;
    }

    // Otherwise, create the user and log them in.
    var registerRes = $resource('/user');
    var payload = {
      login_name: $scope.loginRegister.newLoginName,
      password: $scope.loginRegister.newPassword,
      first_name: $scope.loginRegister.firstName,
      last_name: $scope.loginRegister.lastName,
      location: $scope.loginRegister.location,
      description: $scope.loginRegister.description,
      occupation: $scope.loginRegister.occupation,
    };
    var userModel = registerRes.save(payload, function () {
      $scope.main.setUser(userModel);
      $location.path('/users/' + $scope.main.currentUser._id);
      toast('User registered successfully!');
    }, function errorHandling(err) {
      toast(err.data);
    });
  };

}]);
