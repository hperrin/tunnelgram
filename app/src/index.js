import {Nymph, PubSub} from 'nymph-client';
import {User, TilmeldLogin, TilmeldChangePassword} from 'tilmeld-client';
import {Todo} from './Entities/Todo';

/*
 * This is an AngularJS app. You're not meant to extend it. It's bad. AngularJS
 * is bad. But it's a starting point to show you how to make your own Nymph app,
 * in a better framework. I recommend Svelte.
 */

angular.module('todoApp', [])
.controller('TodoController', ['$scope', ($scope) => {
  $scope.todos = [];
  $scope.uiState = {
    'todoText': '',
    'sort': 'name',
    'showArchived': false,
    'userAvatar': null,
    'userCount': null,
    'isTilmeldAdmin': false
  };
  $scope.currentUser = false;
  $scope.clientConfig = {};
  $scope.loginComponent = null;

  const errHandler = errObj => {
    alert('Error: '+errObj.textStatus+(errObj.message ? '\n\n'+errObj.message : ''));
  };

  // Get the current user.
  User.current().then(user => {
    $scope.currentUser = user;
    $scope.$apply();
    if ($scope.currentUser === null) {
      createLoginComponent();
    }
  }, errHandler);

  // Handle logins and logouts.
  User.on('login', user => {
    $scope.currentUser = user;
    destroyLoginComponent();
    $scope.$apply();
  });
  User.on('logout', () => {
    $scope.currentUser = null;
    $scope.$apply();
    createLoginComponent();
  });

  function createLoginComponent () {
    if (!$scope.loginComponent) {
      $scope.loginComponent = new TilmeldLogin({
        target: document.getElementById('login'),
        data: {
          layout: 'small',
          classInput: 'form-control',
          classSelect: 'form-control',
          classTextarea: 'form-control',
          classSubmit: 'btn btn-primary',
          classButton: 'btn btn-secondary'
        }
      });
    }
  }
  function destroyLoginComponent () {
    if ($scope.loginComponent) {
      $scope.loginComponent.destroy();
      $scope.loginComponent = null;
    }
  }

  // Change password prompt.
  new TilmeldChangePassword({
    target: document.getElementById('changePassword'),
    data: {
      layout: 'compact',
      classInput: 'form-control',
      classSubmit: 'btn btn-primary',
      classButton: 'btn btn-secondary'
    }
  });

  $scope.$watch('currentUser', user => {
    if (user) {
      // Get the current todos.
      $scope.getTodos(false);
      // Get the user's avatar.
      user.getAvatar().then(avatar => {
        $scope.uiState.userAvatar = avatar;
        $scope.$apply();
      });
      // Is the user a Tilmeld admin?
      user.gatekeeper('tilmeld/admin').then(pass => {
        $scope.uiState.isTilmeldAdmin = pass;
        $scope.$apply();
      });
    } else {
      $scope.todos = [];
      $scope.uiState.userAvatar = null;
      $scope.uiState.isTilmeldAdmin = false;
    }
  });

  // Get the client config (for timezones).
  User.getClientConfig().then(clientConfig => {
    $scope.clientConfig = clientConfig;
    $scope.$apply();
  });

  // User functions
  $scope.saveUser = () => {
    $scope.currentUser.save().then(() => {
      $scope.$apply();
    }, errHandler);
  };

  $scope.logout = () => {
    $scope.currentUser.logout();
  };

  // Subscribe to the todos query.
  var subscription;
  $scope.getTodos = archived => {
    if (subscription) {
      subscription.unsubscribe();
    }
    subscription = Nymph.getEntities(
        {"class": Todo.class},
        {
          "type": archived ? '&' : '!&',
          "tag": 'archived'
        }, {
          'type': '&',
          'ref': ['user', $scope.currentUser]
        }
    ).subscribe(update => {
      $scope.uiState.showArchived = archived;
      if (update) {
        PubSub.updateArray($scope.todos, update);
        Nymph.sort($scope.todos, $scope.uiState.sort);
      }
      $scope.$apply();
    }, null, count => {
      $scope.uiState.userCount = count;
      $scope.$apply();
    });
  };

  $scope.addTodo = () => {
    if (typeof $scope.uiState.todoText === 'undefined' || $scope.uiState.todoText === '') {
      return;
    }
    var todo = new Todo();
    todo.set('name', $scope.uiState.todoText);
    todo.save().then(() => {
      $scope.uiState.todoText = '';
      $scope.$apply();
    }, errHandler);
  };

  $scope.sortTodos = () => {
    $scope.todos = Nymph.sort($scope.todos, $scope.uiState.sort);
  };

  $scope.save = todo => {
    todo.save().then(null, errHandler);
  };

  $scope.remaining = () => {
    var count = 0;
    angular.forEach($scope.todos, todo => {
      count += todo.get('done') ? 0 : 1;
    });
    return count;
  };

  $scope.archive = () => {
    var oldTodos = $scope.todos;
    angular.forEach(oldTodos, todo => {
      if (todo.get('done')) {
        todo.archive().then(success => {
          if (!success) {
            alert("Couldn't save changes to "+todo.get('name'));
          }
        }, errHandler);
      }
    });
  };

  $scope.delete = () => {
    Nymph.deleteEntities($scope.todos);
  };
}]);
