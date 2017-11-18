angular.module('todoApp', [])
.service('Nymph', function(){
  return Nymph.default;
}).service('Todo', function(){
  return Todo.default;
}).service('User', function(){
  return User.default;
}).service('TilmeldLogin', function(){
  return TilmeldLogin.default;
}).service('TilmeldChangePassword', function(){
  return TilmeldChangePassword.default;
}).controller('TodoController', ['$scope', 'Nymph', 'Todo', 'User', 'TilmeldLogin', 'TilmeldChangePassword', function($scope, Nymph, Todo, User, TilmeldLogin, TilmeldChangePassword) {
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

  // Get the current user.
  User.current().then(function(user){
    $scope.currentUser = user;
    $scope.$apply();
    if ($scope.currentUser === null) {
      createLoginComponent();
    }
  }, function(errObj) {
    alert("Error: "+errObj.textStatus);
  });

  // Handle logins and logouts.
  User.on('login', function(user){
    $scope.currentUser = user;
    destroyLoginComponent();
    $scope.$apply();
  });
  User.on('logout', function(){
    $scope.currentUser = null;
    $scope.$apply();
    createLoginComponent();
  });
  function createLoginComponent(){
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
  function destroyLoginComponent(){
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

  $scope.$watch('currentUser', function(user){
    if (user) {
      // Get the current todos.
      $scope.getTodos(false);
      // Get the user's avatar.
      user.getAvatar().then(function(avatar){
        $scope.uiState.userAvatar = avatar;
        $scope.$apply();
      });
      // Is the user a Tilmeld admin?
      user.gatekeeper('tilmeld/admin').then(function(pass){
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
  User.getClientConfig().then(function(clientConfig){
    $scope.clientConfig = clientConfig;
    $scope.$apply();
  });

  // User functions
  $scope.saveUser = function(){
    $scope.currentUser.save().then(function(){
      $scope.$apply();
    }, function(errObj){
      alert('Error: '+errObj.textStatus);
    });
  };

  $scope.logout = function(){
    $scope.currentUser.logout();
  };

  // Subscribe to the todos query.
  var subscription;
  $scope.getTodos = function(archived){
    if (subscription) {
      subscription.unsubscribe();
    }
    subscription = Nymph.getEntities({"class": Todo.class}, {"type": archived ? '&' : '!&', "tag": 'archived'}, {'type': '&', 'ref': ['user', $scope.currentUser]}).subscribe(function(todos){
      $scope.uiState.showArchived = archived;
      if (todos) {
        Nymph.updateArray($scope.todos, todos);
        Nymph.sort($scope.todos, $scope.uiState.sort);
      }
      $scope.$apply();
    }, null, function(count){
      $scope.uiState.userCount = count;
      $scope.$apply();
    });
  };

  $scope.addTodo = function(){
    if (typeof $scope.uiState.todoText === 'undefined' || $scope.uiState.todoText === '')
      return;
    var todo = new Todo();
    todo.set('name', $scope.uiState.todoText);
    todo.save().then(function(){
      $scope.uiState.todoText = '';
      $scope.$apply();
    }, function(errObj){
      alert("Error: "+errObj.textStatus);
    });
  };

  $scope.sortTodos = function(){
    $scope.todos = Nymph.sort($scope.todos, $scope.uiState.sort);
  };

  $scope.save = function(todo){
    todo.save().then(null, function(errObj){
      alert('Error: '+errObj.textStatus);
    });
  };

  $scope.remaining = function(){
    var count = 0;
    angular.forEach($scope.todos, function(todo){
      count += todo.get('done') ? 0 : 1;
    });
    return count;
  };

  $scope.archive = function(){
    var oldTodos = $scope.todos;
    angular.forEach(oldTodos, function(todo){
      if (todo.get('done')) {
        todo.archive().then(function(success){
          if (!success)
            alert("Couldn't save changes to "+todo.get('name'));
        }, function(errObj){
          alert("Error: "+errObj.textStatus+"\nCouldn't archive "+todo.get('name'));
        });
      }
    });
  };

  $scope.delete = function(){
    Nymph.deleteEntities($scope.todos);
  };
}]);
