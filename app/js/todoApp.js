angular.module('todoApp', [])
.service('Nymph', function() {
  return Nymph.default;
})
.service('Todo', function() {
  return Todo.default;
})
.controller('TodoController', ['$scope', 'Nymph', 'Todo', function($scope, Nymph, Todo) {
  $scope.todos = [];
  $scope.uiState = {
    'sort': 'name',
    'showArchived': false,
    'userCount': null
  };

  var subscription;
  $scope.getTodos = function(archived){
    if (subscription) {
      subscription.unsubscribe();
    }
    subscription = Nymph.getEntities({"class": Todo.class}, {"type": archived ? '&' : '!&', "tag": 'archived'}).subscribe(function(todos){
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
  $scope.getTodos(false);

  $scope.addTodo = function(){
    if (typeof $scope.todoText === 'undefined' || $scope.todoText === '')
      return;
    var todo = new Todo();
    todo.set('name', $scope.todoText);
    todo.save().then(function(){
      $scope.todoText = '';
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
