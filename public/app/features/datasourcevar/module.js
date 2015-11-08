define([
  'angular'
],
function (angular) {
  'use strict';

  angular
    .module('grafana.services')
    .service('datasourceVarSrv', function(datasourceSrv, VariableDatasource) {

      this.init = function(variableName, datasourceName) {
        datasourceSrv.add(new VariableDatasource(variableName, datasourceName));
      };

      this.remove = function(variableName) {
        datasourceSrv.remove('$' + variableName);
      };
    })
    .factory('VariableDatasource', function(datasourceSrv, $rootScope) {

      function VariableDatasource(variableName, datasourceName) {
        var self = this;

        this.name = '$' + variableName;
        this.value =  '$' + variableName;

        if (datasourceName) {
          updatePrototype(self, datasourceName);
        }

        $rootScope.onAppEvent('datasource-changed', function(e, info) {
          updatePrototype(self, info.datasource);
        }, $rootScope);
      }

      function updatePrototype(self, datasourceName) {
        datasourceSrv.get(datasourceName)
          .then(function (datasource) {
            Object.setPrototypeOf(self, datasource);
            $rootScope.$broadcast('refresh');
          });
      }

      return VariableDatasource;
    });
});
