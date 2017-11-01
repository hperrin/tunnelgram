import React from 'react';
import PropTypes from 'prop-types';
import TodoEl from './TodoEl';
import Todo from 'Todo';

const TodoList = ({todos, archived, onTodoClick}) => (
  <ul>
    {todos.map(todo => (
      <TodoEl key={todo.guid} todo={todo} onClick={() => onTodoClick(todo)} />
    ))}
  </ul>
);

TodoList.propTypes = {
  todos: PropTypes.arrayOf(
    PropTypes.instanceOf(Todo).isRequired
  ).isRequired,
  onTodoClick: PropTypes.func.isRequired
};

export default TodoList;
