'use strict';

cs142App.controller('UserListController', ['$scope', '$resource',
function ($scope, $resource) {
  $scope.main.title = 'Users';
  $scope.main.context = 'List of Users';

  $scope.userList = {};

  var updateUserList = function() {
    var userListRes = $resource('/user/list');
    var userListModel = userListRes.query({}, function () {
      $scope.userList.users = userListModel;
    }, function errorHandling(err) {
      if (err.status === 401) {
        $scope.userList.users = [];
      } else {
        console.log(err);
      }
    });
  };

  $scope.$on('userUpdated', updateUserList);
}]);
