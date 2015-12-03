define([
  'angular',
  'lodash',
],
function (angular, _) {
  'use strict';

  var module = angular.module('grafana.controllers');

  module.controller('TemplateEditorCtrl', function($scope, datasourceSrv, templateSrv, templateValuesSrv) {

    var replacementDefaults = {
      type: 'query',
      datasource: null,
      refresh_on_load: false,
      name: '',
      options: [],
      includeAll: false,
      allFormat: 'glob',
      multi: false,
      multiFormat: 'glob',
    };

    $scope.init = function() {
      $scope.mode = 'list';

      $scope.datasources = _.filter(datasourceSrv.getMetricSources(), function(ds) {
        return !ds.meta.builtIn;
      });

      $scope.variables = templateSrv.variables;

      $scope.dtsSelection = [];
      $scope.dtsSelector = _.map($scope.datasources, function(ds) {
        return ds.name;
      });

      $scope.reset();

      $scope.$watch('mode', function(val) {
        if (val === 'new') {
          $scope.reset();
        }
      });

      $scope.$watch('current.datasource', function(val) {
        if ($scope.mode === 'new') {
          datasourceSrv.get(val).then(function(ds) {
            if (ds.meta.defaultMatchFormat) {
              $scope.current.allFormat = ds.meta.defaultMatchFormat;
              $scope.current.multiFormat = ds.meta.defaultMatchFormat;
            }
          });
        }
      });
    };

    // TODO(DAN): This should no longer be in use because we removed checkboxes
    $scope.toggleDtsSelection = function(dts) {
      var idx = $scope.dtsSelection.indexOf(dts);

      if (idx > -1) {
        $scope.dtsSelection.splice(idx, 1);
      }
      else {
        $scope.dtsSelection.push(dts);
      }

      $scope.current.query = $scope.dtsSelection.join(',');
      $scope.runQuery();
    };

    $scope.add = function() {
      if ($scope.isValid()) {
        if ($scope.current.type === 'datasource') {
          datasourceSrv.addDynamicDatasource($scope.current.name, $scope.dtsSelection[0]);
        }

        $scope.variables.push($scope.current);
        $scope.update();
        $scope.updateSubmenuVisibility();
      }
    };

    $scope.isValid = function() {
      if (!$scope.current.name) {
        $scope.appEvent('alert-warning', ['Validation', 'Template variable requires a name']);
        return false;
      }

      if (!$scope.current.name.match(/^\w+$/)) {
        $scope.appEvent('alert-warning', ['Validation', 'Only word and digit characters are allowed in variable names']);
        return false;
      }

      var sameName = _.findWhere($scope.variables, { name: $scope.current.name });
      if (sameName && sameName !== $scope.current) {
        $scope.appEvent('alert-warning', ['Validation', 'Variable with the same name already exists']);
        return false;
      }

      return true;
    };

    // This makes sure our dynamic datasource still works
    function updateDtsSelection() {
      $scope.dtsSelection = $scope.current.query.split(",");
    }

    $scope.runQuery = function() {
      return templateValuesSrv.updateOptions($scope.current).then(updateDtsSelection, function(err) {
        if (err.data && err.data.message) { err.message = err.data.message; }
        $scope.appEvent("alert-error", ['Templating', 'Template variables could not be initialized: ' + err.message]);
      });
    };

    $scope.edit = function(variable) {
      $scope.current = variable;
      $scope.currentIsNew = false;
      $scope.mode = 'edit';

      if ($scope.current.datasource === void 0) {
        $scope.current.datasource = null;
        $scope.current.type = 'query';
        $scope.current.allFormat = 'glob';
      }

      if (variable.type === 'datasource' && variable.query) {
        $scope.dtsSelection = variable.query.split(",");
      }
    };

    $scope.update = function() {
      if ($scope.isValid()) {
        $scope.runQuery().then(function() {
          $scope.reset();
          $scope.mode = 'list';
        });
      }
    };

    $scope.reset = function() {
      $scope.currentIsNew = true;
      $scope.current = angular.copy(replacementDefaults);
    };

    $scope.typeChanged = function () {
      if ($scope.current.type === 'interval') {
        $scope.current.query = '1m,10m,30m,1h,6h,12h,1d,7d,14d,30d';
      }
      if ($scope.current.type === 'query') {
        $scope.current.query = '';
      }
    };

    $scope.removeVariable = function(variable) {
      var index = _.indexOf($scope.variables, variable);
      $scope.variables.splice(index, 1);

      if (variable && variable.type === 'datasource') {
        datasourceSrv.removeDynamicDatasource(variable.name);
      }

      $scope.updateSubmenuVisibility();
    };

  });

});
