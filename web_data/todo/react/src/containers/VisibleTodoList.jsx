import {connect} from 'react-redux';
import {toggleTodo} from '../actions';
import TodoList from '../components/TodoList';

const getVisibleTodos = (todos, filter) => {
  switch (filter) {
    case 'SHOW_ALL':
      return todos;
    case 'SHOW_OPEN':
      return todos.filter(todo => !todo.data.done);
    case 'SHOW_DONE':
      return todos.filter(todo => todo.data.done);
  }
};

const mapStateToProps = state => {
  return {
    todos: getVisibleTodos(state.todos.todos, state.visibilityFilter),
    archived: state.todos.archived
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onTodoClick: todo => {
      dispatch(toggleTodo(todo));
    }
  };
};

const VisibleTodoList = connect(
  mapStateToProps,
  mapDispatchToProps
)(TodoList);

export default VisibleTodoList;
