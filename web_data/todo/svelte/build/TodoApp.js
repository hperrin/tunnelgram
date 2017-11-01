var TodoApp = (function ( TodoEl, Nymph, Todo ) { 'use strict';

TodoEl = ( TodoEl && TodoEl.__esModule ) ? TodoEl['default'] : TodoEl;
Nymph = ( Nymph && Nymph.__esModule ) ? Nymph['default'] : Nymph;
Todo = ( Todo && Todo.__esModule ) ? Todo['default'] : Todo;

function recompute ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'todos' in newState && differs( state.todos, oldState.todos ) ) ) {
		state.remaining = newState.remaining = template.computed.remaining( state.todos );
	}
}

var template = (function () {
  return {
    oncreate () {
      this.getTodos(this.get('uiShowArchived'));
    },

    data () {
      return {
        todos: [],
        uiSort: 'name',
        uiShowArchived: false,
        userCount: null,
        todoText: ''
      }
    },

    computed: {
      remaining: (todos) => {
        var count = 0;
        for (var i = 0; i < todos.length; i++) {
          count += todos[i].get('done') ? 0 : 1;
        }
        return count;
      }
    },

    methods: {
      getTodos (archived) {
        if (this.get('__subscription')) {
          this.get('__subscription').unsubscribe();
        }
        let subscription = Nymph.getEntities({"class": 'Todo'}, {"type": archived ? '&' : '!&', "tag": 'archived'}).subscribe((newTodos) => {
          this.set({uiShowArchived: archived});
          if (newTodos !== undefined) {
            var todos = this.get('todos');
            Nymph.updateArray(todos, newTodos);
            Nymph.sort(todos, this.get('uiSort'));
            this.set({todos: todos});
          }
        }, null, (count) => {
          this.set({userCount: count});
        });
        this.set({__subscription: subscription});
      },

      addTodo () {
        var todoText = this.get('todoText');
        if (todoText === undefined || todoText === '') {
          return;
        }
        var todo = new Todo();
        todo.set('name', todoText);
        todo.save().then(() => {
          this.set({todoText: ''});
        }, (errObj) => {
          alert("Error: "+errObj.textStatus);
        });
      },

      sortTodos () {
        this.set({todos: Nymph.sort(this.get('todos'), this.get('uiSort'))});
      },

      save (todo) {
        todo.save().then(null, (errObj) => {
          alert('Error: '+errObj.textStatus);
        });
      },

      archive () {
        var oldTodos = this.get('todos');
        for (var i = 0; i < oldTodos.length; i++) {
          var todo = oldTodos[i];
          if (todo.get('done')) {
            todo.archive().then((success) => {
              if (!success) {
                alert("Couldn't save changes to "+todo.get('name'));
              }
            }, (errObj) => {
              alert("Error: "+errObj.textStatus+"\nCouldn't archive "+todo.get('name'));
            });
          }
        }
      },

      deleteTodos () {
        Nymph.deleteEntities(this.get('todos'));
      }
    }
  };
}());

function add_css () {
	var style = createElement( 'style' );
	style.id = 'svelte-4248568516-style';
	style.textContent = "\n  [svelte-4248568516].todo-form, [svelte-4248568516] .todo-form {\n    display: flex;\n  }\n  [svelte-4248568516].todo-form .form-control, [svelte-4248568516] .todo-form .form-control {\n    flex-grow: 1;\n    margin-right: 5px;\n  }\n  [svelte-4248568516].user-count, [svelte-4248568516] .user-count {\n    position: fixed;\n    right: 5px;\n    bottom: 5px;\n  }\n";
	appendNode( style, document.head );
}

function create_main_fragment ( state, component ) {
	var div, div_1, div_2, div_3, text_2, div_4, small, text_3, text_4, br, text_5, text_7, text_10, text_11, div_5, text_12, text_13_value, text_13;

	var each_block_value = state.todos;

	var each_block_iterations = [];

	for ( var i = 0; i < each_block_value.length; i += 1 ) {
		each_block_iterations[i] = create_each_block( state, each_block_value, each_block_value[i], i, component );
	}

	function get_block ( state ) {
		if ( state.uiShowArchived ) return create_if_block;
		return create_if_block_1;
	}

	var current_block = get_block( state );
	var if_block = current_block( state, component );

	var if_block_2 = (state.todos.length > 0) && create_if_block_4( state, component );

	function get_block_1 ( state ) {
		if ( state.uiShowArchived ) return create_if_block_7;
		return create_if_block_8;
	}

	var current_block_1 = get_block_1( state );
	var if_block_4 = current_block_1( state, component );

	var if_block_5 = (state.todos.length > 1) && create_if_block_9( state, component );

	var if_block_6 = (!state.uiShowArchived) && create_if_block_10( state, component );

	return {
		create: function () {
			div = createElement( 'div' );
			div_1 = createElement( 'div' );
			div_2 = createElement( 'div' );
			div_3 = createElement( 'div' );

			for ( var i = 0; i < each_block_iterations.length; i += 1 ) {
				each_block_iterations[i].create();
			}

			text_2 = createText( "\n    " );
			div_4 = createElement( 'div' );
			small = createElement( 'small' );
			if_block.create();
			text_3 = createText( "\n        " );
			if ( if_block_2 ) if_block_2.create();
			text_4 = createText( "\n        " );
			br = createElement( 'br' );
			text_5 = createText( "\n        " );
			if_block_4.create();
			text_7 = createText( "\n      " );
			if ( if_block_5 ) if_block_5.create();
			text_10 = createText( "\n  " );
			if ( if_block_6 ) if_block_6.create();
			text_11 = createText( "\n  " );
			div_5 = createElement( 'div' );
			text_12 = createText( "Active Users: " );
			text_13 = createText( text_13_value = state.userCount );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			setAttribute( div, 'svelte-4248568516', '' );
			div_1.className = "row";
			div_2.className = "col-sm-8";
			div_3.className = "list-group";
			div_3.style.cssText = "clear: both;";
			div_4.className = "col-sm-4";
			div_4.style.cssText = "text-align: center; margin-bottom: 1em;";
			small.className = "alert alert-info";
			small.style.cssText = "display: block;";
			div_5.className = "user-count label label-default";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( div_1, div );
			appendNode( div_2, div_1 );
			appendNode( div_3, div_2 );

			for ( var i = 0; i < each_block_iterations.length; i += 1 ) {
				each_block_iterations[i].mount( div_3, null );
			}

			appendNode( text_2, div_1 );
			appendNode( div_4, div_1 );
			appendNode( small, div_4 );
			if_block.mount( small, null );
			appendNode( text_3, small );
			if ( if_block_2 ) if_block_2.mount( small, null );
			appendNode( text_4, small );
			appendNode( br, small );
			appendNode( text_5, small );
			if_block_4.mount( small, null );
			appendNode( text_7, div_4 );
			if ( if_block_5 ) if_block_5.mount( div_4, null );
			appendNode( text_10, div );
			if ( if_block_6 ) if_block_6.mount( div, null );
			appendNode( text_11, div );
			appendNode( div_5, div );
			appendNode( text_12, div_5 );
			appendNode( text_13, div_5 );
		},

		update: function ( changed, state ) {
			var each_block_value = state.todos;

			if ( 'todos' in changed || 'uiShowArchived' in changed ) {
				for ( var i = 0; i < each_block_value.length; i += 1 ) {
					if ( each_block_iterations[i] ) {
						each_block_iterations[i].update( changed, state, each_block_value, each_block_value[i], i );
					} else {
						each_block_iterations[i] = create_each_block( state, each_block_value, each_block_value[i], i, component );
						each_block_iterations[i].create();
						each_block_iterations[i].mount( div_3, null );
					}
				}

				for ( ; i < each_block_iterations.length; i += 1 ) {
					each_block_iterations[i].unmount();
					each_block_iterations[i].destroy();
				}
				each_block_iterations.length = each_block_value.length;
			}

			if ( current_block === ( current_block = get_block( state ) ) && if_block ) {
				if_block.update( changed, state );
			} else {
				if_block.unmount();
				if_block.destroy();
				if_block = current_block( state, component );
				if_block.create();
				if_block.mount( small, text_3 );
			}

			if ( state.todos.length > 0 ) {
				if ( if_block_2 ) {
					if_block_2.update( changed, state );
				} else {
					if_block_2 = create_if_block_4( state, component );
					if_block_2.create();
					if_block_2.mount( small, text_4 );
				}
			} else if ( if_block_2 ) {
				if_block_2.unmount();
				if_block_2.destroy();
				if_block_2 = null;
			}

			if ( current_block_1 !== ( current_block_1 = get_block_1( state ) ) ) {
				if_block_4.unmount();
				if_block_4.destroy();
				if_block_4 = current_block_1( state, component );
				if_block_4.create();
				if_block_4.mount( small, null );
			}

			if ( state.todos.length > 1 ) {
				if ( if_block_5 ) {
					if_block_5.update( changed, state );
				} else {
					if_block_5 = create_if_block_9( state, component );
					if_block_5.create();
					if_block_5.mount( div_4, null );
				}
			} else if ( if_block_5 ) {
				if_block_5.unmount();
				if_block_5.destroy();
				if_block_5 = null;
			}

			if ( !state.uiShowArchived ) {
				if ( if_block_6 ) {
					if_block_6.update( changed, state );
				} else {
					if_block_6 = create_if_block_10( state, component );
					if_block_6.create();
					if_block_6.mount( div, text_11 );
				}
			} else if ( if_block_6 ) {
				if_block_6.unmount();
				if_block_6.destroy();
				if_block_6 = null;
			}

			if ( text_13_value !== ( text_13_value = state.userCount ) ) {
				text_13.data = text_13_value;
			}
		},

		unmount: function () {
			detachNode( div );

			for ( var i = 0; i < each_block_iterations.length; i += 1 ) {
				each_block_iterations[i].unmount();
			}

			if_block.unmount();
			if ( if_block_2 ) if_block_2.unmount();
			if_block_4.unmount();
			if ( if_block_5 ) if_block_5.unmount();
			if ( if_block_6 ) if_block_6.unmount();
		},

		destroy: function () {
			destroyEach( each_block_iterations, false, 0 );

			if_block.destroy();
			if ( if_block_2 ) if_block_2.destroy();
			if_block_4.destroy();
			if ( if_block_5 ) if_block_5.destroy();
			if ( if_block_6 ) if_block_6.destroy();
		}
	};
}

function create_each_block ( state, each_block_value, todo, todo_index, component ) {
	var todoel_updating = false;

	var todoel_initial_data = { archived: state.uiShowArchived };
	if ( todo_index in each_block_value ) todoel_initial_data.todo = todo;
	var todoel = new TodoEl({
		_root: component._root,
		data: todoel_initial_data
	});

	component._bindings.push( function () {
		if ( todoel._torndown ) return;
		todoel.observe( 'todo', function ( value ) {
			if ( todoel_updating ) return;
			todoel_updating = true;
			var list = this._context.each_block_value;
			var index = this._context.todo_index;
			list[index] = value;

			component._set({ todos: component.get( 'todos' ) });
			todoel_updating = false;
		}, { init: differs( todoel.get( 'todo' ), todo ) });
	});

	todoel._context = {
		each_block_value: each_block_value,
		todo_index: todo_index
	};

	return {
		create: function () {
			todoel._fragment.create();
		},

		mount: function ( target, anchor ) {
			todoel._fragment.mount( target, anchor );
		},

		update: function ( changed, state, each_block_value, todo, todo_index ) {
			if ( !todoel_updating && 'todos' in changed ) {
				todoel_updating = true;
				todoel._set({ todo: todo });
				todoel_updating = false;
			}

			todoel._context.each_block_value = each_block_value;
			todoel._context.todo_index = todo_index;

			var todoel_changes = {};

			if ( 'uiShowArchived' in changed ) todoel_changes.archived = state.uiShowArchived;

			if ( Object.keys( todoel_changes ).length ) todoel.set( todoel_changes );
		},

		unmount: function () {
			todoel._fragment.unmount();
		},

		destroy: function () {
			todoel.destroy( false );
		}
	};
}

function create_if_block_2 ( state, component ) {
	var span, text;

	return {
		create: function () {
			span = createElement( 'span' );
			text = createText( "0 todos" );
		},

		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
			appendNode( text, span );
		},

		update: noop,

		unmount: function () {
			detachNode( span );
		},

		destroy: noop
	};
}

function create_if_block_3 ( state, component ) {
	var span, text_value, text, text_1, text_2_value, text_2, text_3;

	return {
		create: function () {
			span = createElement( 'span' );
			text = createText( text_value = state.remaining );
			text_1 = createText( " of " );
			text_2 = createText( text_2_value = state.todos.length );
			text_3 = createText( " remaining" );
		},

		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
			appendNode( text, span );
			appendNode( text_1, span );
			appendNode( text_2, span );
			appendNode( text_3, span );
		},

		update: function ( changed, state ) {
			if ( text_value !== ( text_value = state.remaining ) ) {
				text.data = text_value;
			}

			if ( text_2_value !== ( text_2_value = state.todos.length ) ) {
				text_2.data = text_2_value;
			}
		},

		unmount: function () {
			detachNode( span );
		},

		destroy: noop
	};
}

function create_if_block ( state, component ) {
	var span, text_value, text, text_1;

	return {
		create: function () {
			span = createElement( 'span' );
			text = createText( text_value = state.todos.length );
			text_1 = createText( " archived todos" );
		},

		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
			appendNode( text, span );
			appendNode( text_1, span );
		},

		update: function ( changed, state ) {
			if ( text_value !== ( text_value = state.todos.length ) ) {
				text.data = text_value;
			}
		},

		unmount: function () {
			detachNode( span );
		},

		destroy: noop
	};
}

function create_if_block_1 ( state, component ) {
	var span;

	function get_block ( state ) {
		if ( state.todos.length == 0 ) return create_if_block_2;
		return create_if_block_3;
	}

	var current_block = get_block( state );
	var if_block_1 = current_block( state, component );

	return {
		create: function () {
			span = createElement( 'span' );
			if_block_1.create();
		},

		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
			if_block_1.mount( span, null );
		},

		update: function ( changed, state ) {
			if ( current_block === ( current_block = get_block( state ) ) && if_block_1 ) {
				if_block_1.update( changed, state );
			} else {
				if_block_1.unmount();
				if_block_1.destroy();
				if_block_1 = current_block( state, component );
				if_block_1.create();
				if_block_1.mount( span, null );
			}
		},

		unmount: function () {
			detachNode( span );
			if_block_1.unmount();
		},

		destroy: function () {
			if_block_1.destroy();
		}
	};
}

function create_if_block_5 ( state, component ) {
	var a, text;

	function click_handler ( event ) {
		component.deleteTodos();
	}

	return {
		create: function () {
			a = createElement( 'a' );
			text = createText( "delete" );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			a.href = "javascript:void(0)";
			addListener( a, 'click', click_handler );
		},

		mount: function ( target, anchor ) {
			insertNode( a, target, anchor );
			appendNode( text, a );
		},

		unmount: function () {
			detachNode( a );
		},

		destroy: function () {
			removeListener( a, 'click', click_handler );
		}
	};
}

function create_if_block_6 ( state, component ) {
	var a, text;

	function click_handler ( event ) {
		component.archive();
	}

	return {
		create: function () {
			a = createElement( 'a' );
			text = createText( "archive done" );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			a.href = "javascript:void(0)";
			addListener( a, 'click', click_handler );
		},

		mount: function ( target, anchor ) {
			insertNode( a, target, anchor );
			appendNode( text, a );
		},

		unmount: function () {
			detachNode( a );
		},

		destroy: function () {
			removeListener( a, 'click', click_handler );
		}
	};
}

function create_if_block_4 ( state, component ) {
	var span, text, text_1;

	function get_block ( state ) {
		if ( state.uiShowArchived ) return create_if_block_5;
		return create_if_block_6;
	}

	var current_block = get_block( state );
	var if_block_3 = current_block( state, component );

	return {
		create: function () {
			span = createElement( 'span' );
			text = createText( "[\n            " );
			if_block_3.create();
			text_1 = createText( "\n            ]" );
		},

		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
			appendNode( text, span );
			if_block_3.mount( span, null );
			appendNode( text_1, span );
		},

		update: function ( changed, state ) {
			if ( current_block !== ( current_block = get_block( state ) ) ) {
				if_block_3.unmount();
				if_block_3.destroy();
				if_block_3 = current_block( state, component );
				if_block_3.create();
				if_block_3.mount( span, text_1 );
			}
		},

		unmount: function () {
			detachNode( span );
			if_block_3.unmount();
		},

		destroy: function () {
			if_block_3.destroy();
		}
	};
}

function create_if_block_7 ( state, component ) {
	var a, text;

	function click_handler ( event ) {
		component.getTodos(false);
	}

	return {
		create: function () {
			a = createElement( 'a' );
			text = createText( "show current" );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			a.href = "javascript:void(0)";
			addListener( a, 'click', click_handler );
		},

		mount: function ( target, anchor ) {
			insertNode( a, target, anchor );
			appendNode( text, a );
		},

		unmount: function () {
			detachNode( a );
		},

		destroy: function () {
			removeListener( a, 'click', click_handler );
		}
	};
}

function create_if_block_8 ( state, component ) {
	var a, text;

	function click_handler ( event ) {
		component.getTodos(true);
	}

	return {
		create: function () {
			a = createElement( 'a' );
			text = createText( "show archived" );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			a.href = "javascript:void(0)";
			addListener( a, 'click', click_handler );
		},

		mount: function ( target, anchor ) {
			insertNode( a, target, anchor );
			appendNode( text, a );
		},

		unmount: function () {
			detachNode( a );
		},

		destroy: function () {
			removeListener( a, 'click', click_handler );
		}
	};
}

function create_if_block_9 ( state, component ) {
	var div, text, br, text_1, label, input, input_updating = false, text_2, text_3, label_1, input_1, input_1_updating = false, text_4;

	function input_change_handler () {
		input_updating = true;
		if ( !input.checked ) return;
		component._set({ uiSort: input.__value });
		input_updating = false;
	}

	function change_handler ( event ) {
		component.sortTodos();
	}

	function input_1_change_handler () {
		input_1_updating = true;
		if ( !input_1.checked ) return;
		component._set({ uiSort: input_1.__value });
		input_1_updating = false;
	}

	function change_handler_1 ( event ) {
		component.sortTodos();
	}

	return {
		create: function () {
			div = createElement( 'div' );
			text = createText( "Sort: " );
			br = createElement( 'br' );
			text_1 = createText( "\n          " );
			label = createElement( 'label' );
			input = createElement( 'input' );
			text_2 = createText( " Alpha" );
			text_3 = createText( "\n             \n          " );
			label_1 = createElement( 'label' );
			input_1 = createElement( 'input' );
			text_4 = createText( " Created" );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			div.style.cssText = "text-align: left;";
			label.style.cssText = "font-weight: normal;";
			input.type = "radio";
			input.name = "sort";
			input.__value = "name";
			input.value = input.__value;
			component._bindingGroups[0].push( input );

			addListener( input, 'change', input_change_handler );

			addListener( input, 'change', change_handler );
			label_1.style.cssText = "font-weight: normal;";
			input_1.type = "radio";
			input_1.name = "sort";
			input_1.__value = "cdate";
			input_1.value = input_1.__value;
			component._bindingGroups[0].push( input_1 );

			addListener( input_1, 'change', input_1_change_handler );

			addListener( input_1, 'change', change_handler_1 );
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( text, div );
			appendNode( br, div );
			appendNode( text_1, div );
			appendNode( label, div );
			appendNode( input, label );

			input.checked = input.__value === state.uiSort;

			appendNode( text_2, label );
			appendNode( text_3, div );
			appendNode( label_1, div );
			appendNode( input_1, label_1 );

			input_1.checked = input_1.__value === state.uiSort;

			appendNode( text_4, label_1 );
		},

		update: function ( changed, state ) {
			if ( !input_updating ) {
				input.checked = input.__value === state.uiSort;
			}

			if ( !input_1_updating ) {
				input_1.checked = input_1.__value === state.uiSort;
			}
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: function () {
			component._bindingGroups[0].splice( component._bindingGroups[0].indexOf( input ), 1 );

			removeListener( input, 'change', input_change_handler );
			removeListener( input, 'change', change_handler );

			component._bindingGroups[0].splice( component._bindingGroups[0].indexOf( input_1 ), 1 );

			removeListener( input_1, 'change', input_1_change_handler );
			removeListener( input_1, 'change', change_handler_1 );
		}
	};
}

function create_if_block_10 ( state, component ) {
	var form, input, input_updating = false, text, input_1, input_1_value_value;

	function submit_handler ( event ) {
		component.addTodo(event.preventDefault());
	}

	function input_input_handler () {
		input_updating = true;
		component._set({ todoText: input.value });
		input_updating = false;
	}

	return {
		create: function () {
			form = createElement( 'form' );
			input = createElement( 'input' );
			text = createText( "\n      " );
			input_1 = createElement( 'input' );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			form.className = "todo-form";
			form.style.cssText = "margin-bottom: 20px;";
			addListener( form, 'submit', submit_handler );
			input.className = "form-control";
			input.type = "text";
			input.placeholder = "add new todo here";

			addListener( input, 'input', input_input_handler );

			input_1.className = "btn btn-default";
			input_1.type = "submit";
			input_1.value = input_1_value_value = "add \#" + ( state.todos.length + 1 );
		},

		mount: function ( target, anchor ) {
			insertNode( form, target, anchor );
			appendNode( input, form );

			input.value = state.todoText;

			appendNode( text, form );
			appendNode( input_1, form );
		},

		update: function ( changed, state ) {
			if ( !input_updating ) {
				input.value = state.todoText;
			}

			if ( input_1_value_value !== ( input_1_value_value = "add \#" + ( state.todos.length + 1 ) ) ) {
				input_1.value = input_1_value_value;
			}
		},

		unmount: function () {
			detachNode( form );
		},

		destroy: function () {
			removeListener( form, 'submit', submit_handler );
			removeListener( input, 'input', input_input_handler );
		}
	};
}

function TodoApp ( options ) {
	options = options || {};
	this._state = assign( template.data(), options.data );
	recompute( this._state, this._state, {}, true );
	this._bindingGroups = [ [] ];

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;

	this._torndown = false;
	if ( !document.getElementById( 'svelte-4248568516-style' ) ) add_css();
	this._oncreate = [];
	this._bindings = [];

	this._fragment = create_main_fragment( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}

	callAll(this._oncreate);
	callAll(this._bindings);

	if ( options._root ) {
		options._root._oncreate.push( template.oncreate.bind( this ) );
	} else {
		template.oncreate.call( this );
	}
}

assign( TodoApp.prototype, template.methods, {
 	get: get,
 	fire: fire,
 	observe: observe,
 	on: on,
 	set: set
 });

TodoApp.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute( this._state, newState, oldState, false )
	dispatchObservers( this, this._observers.pre, newState, oldState );
	this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
	callAll(this._oncreate);
	callAll(this._bindings);
};

TodoApp.prototype.teardown = TodoApp.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	if ( detach !== false ) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function differs(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function createElement(name) {
	return document.createElement(name);
}

function appendNode(node, target) {
	target.appendChild(node);
}

function createText(data) {
	return document.createTextNode(data);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function destroyEach(iterations, detach, start) {
	for (var i = start; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].destroy(detach);
	}
}

function noop() {}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function callAll(fns) {
	while (fns && fns.length) fns.pop()();
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function on(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function set(newState) {
	this._set(assign({}, newState));
	callAll(this._root._oncreate);
}

function dispatchObservers(component, group, newState, oldState) {
	for (var key in group) {
		if (!(key in newState)) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		if (differs(newValue, oldValue)) {
			var callbacks = group[key];
			if (!callbacks) continue;

			for (var i = 0; i < callbacks.length; i += 1) {
				var callback = callbacks[i];
				if (callback.__calling) continue;

				callback.__calling = true;
				callback.call(component, newValue, oldValue);
				callback.__calling = false;
			}
		}
	}
}

return TodoApp;

}(TodoEl, Nymph, Todo));