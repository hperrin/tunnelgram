<!DOCTYPE html>
<html ng-app="todoApp">
<head>
  <title>Nymph Angular Collab Todo App</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="text/javascript">
    (function(){
      var s = document.createElement("script"); s.setAttribute("src", "https://www.promisejs.org/polyfills/promise-5.0.0.min.js");
      (typeof Promise !== "undefined" && typeof Promise.all === "function") || document.getElementsByTagName('head')[0].appendChild(s);
    })();
    NymphOptions = {
      restURL: '/rest.php',
      pubsubURL: 'ws://'+window.location.hostname+':8081',
      rateLimit: 100
    };
  </script>
  <style type="text/css">
    .todo-form {
      display: flex;
    }
    .todo-form .form-control {
      flex-grow: 1;
      margin-right: 5px;
    }
    .user-count {
      position: fixed;
      right: 5px;
      bottom: 5px;
    }
    label.list-group-item {
      font-weight: normal;
      cursor: pointer;
    }
    label.list-group-item > .todo-row {
      display: flex;
      justify-content: space-between;
    }
    .todo-flex {
      display: flex;
    }
    .todo-controls {
      flex-grow: 1;
    }
    .todo-input {
      display: inline;
      background-color: transparent;
      border: 0;
      flex-grow: 1;
    }
    .todo-input.done-true {
      text-decoration: line-through;
      color: grey;
    }
    .todo-date {
      margin-left: 5px;
      flex-shrink: 1;
    }
  </style>
  <script src="/node_modules/nymph-client/lib-umd/Nymph.js"></script>
  <script src="/node_modules/nymph-client/lib-umd/Entity.js"></script>
  <script src="/node_modules/nymph-client/lib-umd/PubSub.js"></script>
  <script src="../Todo.js"></script>

  <script src="//ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"></script>
  <script src="todoApp.js"></script>
  <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
</head>
<body>
  <div class="container" ng-controller="TodoController">
    <div class="page-header">
      <h2 style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap;">
        <span>
          Collaborative Todo List
        </span>
        <small>
          <a href="../react/" target="_self">React</a> |
          <span>Angular 1</span> |
          <a href="../svelte/" target="_self">Svelte</a>
        </small>
      </h2>
    </div>
    <div class="row">
      <div class="col-sm-8">
        <div class="list-group" style="clear: both;">
          <label ng-repeat="todo in todos track by todo.guid" class="list-group-item list-group-item-{{todo.data.done ? 'success' : 'warning'}}">
            <span class="todo-row">
              <span class="todo-controls todo-flex">
                <input ng-if="!uiState.showArchived" type="checkbox" ng-model="todo.data.done" ng-change="save(todo)" style="margin-right: 5px;">
                <input class="todo-input done-{{todo.data.done}}" ng-model="todo.data.name" ng-change="save(todo)" ng-model-options="{updateOn: 'blur'}" />
              </span>
              <span class="todo-date todo-flex">
                {{todo.cdate * 1000 | date:'yyyy-MM-dd HH:MM'}}
              </span>
            </span>
          </label>
        </div>
      </div>
      <div class="col-sm-4" style="text-align: center; margin-bottom: 1em;">
        <small class="alert alert-info" style="display: block;">
          <span ng-if="!uiState.showArchived">
            <span ng-if="todos.length > 0">{{remaining()}} of {{todos.length}} remaining</span>
            <span ng-if="todos.length == 0">0 todos</span>
          </span>
          <span ng-if="uiState.showArchived">{{todos.length}} archived todos</span>
          <span ng-if="todos.length > 0">
            [
            <a href="javascript:void(0)" ng-if="!uiState.showArchived" ng-click="archive()">archive done</a>
            <a href="javascript:void(0)" ng-if="uiState.showArchived" ng-click="delete()">delete</a>
            ]
          </span>
          <br>
          <a href="javascript:void(0)" ng-click="getTodos(true);" ng-if="!uiState.showArchived">show archived</a>
          <a href="javascript:void(0)" ng-click="getTodos(false);" ng-if="uiState.showArchived">show current</a>
        </small>
        <div ng-if="todos.length > 1" style="text-align: left;">
          Sort: <br>
          <label style="font-weight: normal;">
            <input type="radio" ng-model="uiState.sort" ng-change="sortTodos()" name="sort" value="name"> Alpha</label>
          &nbsp;&nbsp;&nbsp;
          <label style="font-weight: normal;">
            <input type="radio" ng-model="uiState.sort" ng-change="sortTodos()" name="sort" value="cdate"> Created</label>
        </div>
      </div>
    </div>
    <form class="todo-form" ng-show="!uiState.showArchived" ng-submit="addTodo()" style="margin-bottom: 20px;">
      <input class="form-control" type="text" ng-model="todoText" placeholder="add new todo here">
      <input class="btn btn-default" type="submit" value="add #{{todos.length + 1}}">
    </form>
    <div class="user-count label label-default">
      Active Users: {{uiState.userCount}}
    </div>
  </div>
</body>
</html>
