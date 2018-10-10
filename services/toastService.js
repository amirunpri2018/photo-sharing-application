'use strict';

angular.module('toastService', [])
    .service('ToastService', ['$mdToast', function($mdToast) {
        return function(text) {
            $mdToast.show(
                $mdToast.simple()
                .textContent(text)
                .capsule(true)
                .position('upper right')
                .hideDelay(8000)
            );
        };
    }]);
