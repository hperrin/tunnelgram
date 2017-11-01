var TodoApp =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 18);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = React;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.index = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var addTodo = exports.addTodo = function addTodo(name) {
    return {
      type: 'ADD_TODO',
      name: name
    };
  };

  var setVisibilityFilter = exports.setVisibilityFilter = function setVisibilityFilter(filter) {
    return {
      type: 'SET_VISIBILITY_FILTER',
      filter: filter
    };
  };

  var toggleTodo = exports.toggleTodo = function toggleTodo(todo) {
    return {
      type: 'TOGGLE_TODO',
      todo: todo
    };
  };

  var subscribe = exports.subscribe = function subscribe(archived) {
    return {
      type: 'SUBSCRIBE',
      archived: archived
    };
  };

  var updateUserCount = exports.updateUserCount = function updateUserCount(userCount) {
    return {
      type: 'UPDATE_USER_COUNT',
      userCount: userCount
    };
  };

  var updateTodos = exports.updateTodos = function updateTodos(todos, archived) {
    return {
      type: 'UPDATE_TODOS',
      todos: todos,
      archived: archived
    };
  };
});

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = ReactRedux;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = Todo;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = PropTypes;

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = Redux;

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = Nymph;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(0), __webpack_require__(11), __webpack_require__(15), __webpack_require__(17)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('react'), require('./Footer'), require('../containers/AddTodo'), require('../containers/VisibleTodoList'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.react, global.Footer, global.AddTodo, global.VisibleTodoList);
    global.App = mod.exports;
  }
})(this, function (exports, _react, _Footer, _AddTodo, _VisibleTodoList) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _react2 = _interopRequireDefault(_react);

  var _Footer2 = _interopRequireDefault(_Footer);

  var _AddTodo2 = _interopRequireDefault(_AddTodo);

  var _VisibleTodoList2 = _interopRequireDefault(_VisibleTodoList);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var App = function App() {
    return _react2.default.createElement(
      'div',
      null,
      _react2.default.createElement(_AddTodo2.default, null),
      _react2.default.createElement(_VisibleTodoList2.default, null),
      _react2.default.createElement(_Footer2.default, null)
    );
  };

  exports.default = App;
});

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.AsyncDispatch = mod.exports;
  }
})(this, function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (store) {
    return function (next) {
      return function (action) {
        var syncActivityFinished = false;
        var actionQueue = [];

        function flushQueue() {
          actionQueue.forEach(function (a) {
            return store.dispatch(a);
          }); // flush queue
          actionQueue = [];
        }

        function asyncDispatch(asyncAction) {
          actionQueue = actionQueue.concat([asyncAction]);

          if (syncActivityFinished) {
            flushQueue();
          }
        }

        var actionWithAsyncDispatch = Object.assign({}, action, { asyncDispatch: asyncDispatch });

        next(actionWithAsyncDispatch);
        syncActivityFinished = true;
        flushQueue();
      };
    };
  };
});

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(5), __webpack_require__(20), __webpack_require__(21), __webpack_require__(19)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('redux'), require('./todos'), require('./visibilityFilter'), require('./subscription'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.redux, global.todos, global.visibilityFilter, global.subscription);
    global.index = mod.exports;
  }
})(this, function (exports, _redux, _todos, _visibilityFilter, _subscription) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _todos2 = _interopRequireDefault(_todos);

  var _visibilityFilter2 = _interopRequireDefault(_visibilityFilter);

  var _subscription2 = _interopRequireDefault(_subscription);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var todoApp = (0, _redux.combineReducers)({
    todos: _todos2.default,
    visibilityFilter: _visibilityFilter2.default,
    subscription: _subscription2.default
  });

  exports.default = todoApp;
});

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = ReactDOM;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(0), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('react'), require('../containers/FilterLink'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.react, global.FilterLink);
    global.Footer = mod.exports;
  }
})(this, function (exports, _react, _FilterLink) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _react2 = _interopRequireDefault(_react);

  var _FilterLink2 = _interopRequireDefault(_FilterLink);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var Footer = function Footer() {
    return _react2.default.createElement(
      'p',
      null,
      'Show:',
      ' ',
      _react2.default.createElement(
        _FilterLink2.default,
        { filter: 'SHOW_ALL' },
        'All'
      ),
      ', ',
      _react2.default.createElement(
        _FilterLink2.default,
        { filter: 'SHOW_OPEN' },
        'Open'
      ),
      ', ',
      _react2.default.createElement(
        _FilterLink2.default,
        { filter: 'SHOW_DONE' },
        'Done'
      )
    );
  };

  exports.default = Footer;
});

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(0), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('react'), require('prop-types'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.react, global.propTypes);
    global.Link = mod.exports;
  }
})(this, function (exports, _react, _propTypes) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _react2 = _interopRequireDefault(_react);

  var _propTypes2 = _interopRequireDefault(_propTypes);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var Link = function Link(_ref) {
    var active = _ref.active,
        children = _ref.children,
        _onClick = _ref.onClick;

    if (active) {
      return _react2.default.createElement(
        'span',
        null,
        children
      );
    }

    return _react2.default.createElement(
      'a',
      {
        href: 'javascript:void(0)',
        onClick: function onClick(e) {
          _onClick();
        }
      },
      children
    );
  };

  Link.propTypes = {
    active: _propTypes2.default.bool.isRequired,
    children: _propTypes2.default.node.isRequired,
    onClick: _propTypes2.default.func.isRequired
  };

  exports.default = Link;
});

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(0), __webpack_require__(4), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('react'), require('prop-types'), require('Todo'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.react, global.propTypes, global.Todo);
    global.TodoEl = mod.exports;
  }
})(this, function (exports, _react, _propTypes, _Todo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _react2 = _interopRequireDefault(_react);

  var _propTypes2 = _interopRequireDefault(_propTypes);

  var _Todo2 = _interopRequireDefault(_Todo);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var TodoEl = function TodoEl(_ref) {
    var onClick = _ref.onClick,
        todo = _ref.todo;
    return _react2.default.createElement(
      'li',
      {
        onClick: onClick,
        style: {
          textDecoration: todo.data.done ? 'line-through' : 'none'
        }
      },
      todo.data.name
    );
  };

  TodoEl.propTypes = {
    onClick: _propTypes2.default.func.isRequired,
    todo: _propTypes2.default.instanceOf(_Todo2.default).isRequired
  };

  exports.default = TodoEl;
});

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(0), __webpack_require__(4), __webpack_require__(13), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('react'), require('prop-types'), require('./TodoEl'), require('Todo'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.react, global.propTypes, global.TodoEl, global.Todo);
    global.TodoList = mod.exports;
  }
})(this, function (exports, _react, _propTypes, _TodoEl, _Todo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _react2 = _interopRequireDefault(_react);

  var _propTypes2 = _interopRequireDefault(_propTypes);

  var _TodoEl2 = _interopRequireDefault(_TodoEl);

  var _Todo2 = _interopRequireDefault(_Todo);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var TodoList = function TodoList(_ref) {
    var todos = _ref.todos,
        archived = _ref.archived,
        onTodoClick = _ref.onTodoClick;
    return _react2.default.createElement(
      'ul',
      null,
      todos.map(function (todo) {
        return _react2.default.createElement(_TodoEl2.default, { key: todo.guid, todo: todo, onClick: function onClick() {
            return onTodoClick(todo);
          } });
      })
    );
  };

  TodoList.propTypes = {
    todos: _propTypes2.default.arrayOf(_propTypes2.default.instanceOf(_Todo2.default).isRequired).isRequired,
    onTodoClick: _propTypes2.default.func.isRequired
  };

  exports.default = TodoList;
});

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(0), __webpack_require__(2), __webpack_require__(1)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('react'), require('react-redux'), require('../actions'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.react, global.reactRedux, global.actions);
    global.AddTodo = mod.exports;
  }
})(this, function (exports, _react, _reactRedux, _actions) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _react2 = _interopRequireDefault(_react);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var AddTodo = function AddTodo(_ref) {
    var dispatch = _ref.dispatch;

    var input = void 0;

    return _react2.default.createElement(
      'div',
      null,
      _react2.default.createElement(
        'form',
        {
          onSubmit: function onSubmit(e) {
            e.preventDefault();
            var trimmedInput = input.value.trim();
            if (!trimmedInput) {
              return;
            }
            dispatch((0, _actions.addTodo)(trimmedInput));
            input.value = '';
          }
        },
        _react2.default.createElement('input', {
          ref: function ref(node) {
            input = node;
          }
        }),
        _react2.default.createElement(
          'button',
          { type: 'submit' },
          'Add Todo'
        )
      )
    );
  };
  AddTodo = (0, _reactRedux.connect)()(AddTodo);

  exports.default = AddTodo;
});

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(2), __webpack_require__(1), __webpack_require__(12)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('react-redux'), require('../actions'), require('../components/Link'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.reactRedux, global.actions, global.Link);
    global.FilterLink = mod.exports;
  }
})(this, function (exports, _reactRedux, _actions, _Link) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _Link2 = _interopRequireDefault(_Link);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var mapStateToProps = function mapStateToProps(state, ownProps) {
    return {
      active: ownProps.filter === state.visibilityFilter
    };
  };

  var mapDispatchToProps = function mapDispatchToProps(dispatch, ownProps) {
    return {
      onClick: function onClick() {
        dispatch((0, _actions.setVisibilityFilter)(ownProps.filter));
      }
    };
  };

  var FilterLink = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Link2.default);

  exports.default = FilterLink;
});

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(2), __webpack_require__(1), __webpack_require__(14)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require('react-redux'), require('../actions'), require('../components/TodoList'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.reactRedux, global.actions, global.TodoList);
    global.VisibleTodoList = mod.exports;
  }
})(this, function (exports, _reactRedux, _actions, _TodoList) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _TodoList2 = _interopRequireDefault(_TodoList);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var getVisibleTodos = function getVisibleTodos(todos, filter) {
    switch (filter) {
      case 'SHOW_ALL':
        return todos;
      case 'SHOW_OPEN':
        return todos.filter(function (todo) {
          return !todo.data.done;
        });
      case 'SHOW_DONE':
        return todos.filter(function (todo) {
          return todo.data.done;
        });
    }
  };

  var mapStateToProps = function mapStateToProps(state) {
    return {
      todos: getVisibleTodos(state.todos.todos, state.visibilityFilter),
      archived: state.todos.archived
    };
  };

  var mapDispatchToProps = function mapDispatchToProps(dispatch) {
    return {
      onTodoClick: function onTodoClick(todo) {
        dispatch((0, _actions.toggleTodo)(todo));
      }
    };
  };

  var VisibleTodoList = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_TodoList2.default);

  exports.default = VisibleTodoList;
});

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(10), __webpack_require__(2), __webpack_require__(5), __webpack_require__(9), __webpack_require__(8), __webpack_require__(1), __webpack_require__(7)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(require('react'), require('react-dom'), require('react-redux'), require('redux'), require('./reducers'), require('./middleware/AsyncDispatch'), require('./actions'), require('./components/App'));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.react, global.reactDom, global.reactRedux, global.redux, global.reducers, global.AsyncDispatch, global.actions, global.App);
    global.index = mod.exports;
  }
})(this, function (_react, _reactDom, _reactRedux, _redux, _reducers, _AsyncDispatch, _actions, _App) {
  'use strict';

  var _react2 = _interopRequireDefault(_react);

  var _reducers2 = _interopRequireDefault(_reducers);

  var _AsyncDispatch2 = _interopRequireDefault(_AsyncDispatch);

  var _App2 = _interopRequireDefault(_App);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var store = (0, _redux.createStore)(_reducers2.default, (0, _redux.applyMiddleware)(_AsyncDispatch2.default));

  store.dispatch((0, _actions.subscribe)(false));

  (0, _reactDom.render)(_react2.default.createElement(
    _reactRedux.Provider,
    { store: store },
    _react2.default.createElement(_App2.default, null)
  ), document.getElementById('todoApp'));
});

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(6), __webpack_require__(3), __webpack_require__(1)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require("Nymph"), require("Todo"), require("../actions"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Nymph, global.Todo, global.actions);
    global.subscription = mod.exports;
  }
})(this, function (exports, _Nymph, _Todo, _actions) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _Nymph2 = _interopRequireDefault(_Nymph);

  var _Todo2 = _interopRequireDefault(_Todo);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  var todos = function todos() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { subscription: null, userCount: null };
    var action = arguments[1];

    switch (action.type) {
      case 'SUBSCRIBE':
        if (state.subscription) {
          state.subscription.unsubscribe();
        }
        var archived = action.archived;
        var subscription = _Nymph2.default.getEntities({ "class": 'Todo' }, { "type": archived ? '&' : '!&', "tag": 'archived' }).subscribe(function (newTodos) {
          action.asyncDispatch((0, _actions.updateTodos)(newTodos, archived));
        }, null, function (count) {
          action.asyncDispatch((0, _actions.updateUserCount)(count));
        });
        return _extends({}, state, { subscription: subscription });
      case 'UPDATE_USER_COUNT':
        return _extends({}, state, { userCount: action.userCount });
      default:
        return state;
    }
  };

  exports.default = todos;
});

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(6), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports, require("Nymph"), require("Todo"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Nymph, global.Todo);
    global.todos = mod.exports;
  }
})(this, function (exports, _Nymph, _Todo) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _Nymph2 = _interopRequireDefault(_Nymph);

  var _Todo2 = _interopRequireDefault(_Todo);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  var todos = function todos() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { todos: [], archived: false };
    var action = arguments[1];

    switch (action.type) {
      case 'UPDATE_TODOS':
        if (action.todos === undefined) {
          return state;
        }
        var _todos = state.todos.slice();
        var archived = action.archived;
        _Nymph2.default.updateArray(_todos, action.todos);
        // Nymph.sort(todos, this.get('uiSort'));
        return _extends({}, state, { todos: _todos, archived: archived });
      case 'ADD_TODO':
        var todo = new _Todo2.default();
        todo.set("name", action.name);
        todo.save();
        return state;
      case 'TOGGLE_TODO':
        action.todo.set("done", !action.todo.get("done"));
        action.todo.save();
        return state;
      default:
        return state;
    }
  };

  exports.default = todos;
});

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.visibilityFilter = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var visibilityFilter = function visibilityFilter() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'SHOW_ALL';
    var action = arguments[1];

    switch (action.type) {
      case 'SET_VISIBILITY_FILTER':
        return action.filter;
      default:
        return state;
    }
  };

  exports.default = visibilityFilter;
});

/***/ })
/******/ ]);