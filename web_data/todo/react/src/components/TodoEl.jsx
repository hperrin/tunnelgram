import React from 'react';
import PropTypes from 'prop-types';
import Todo from 'Todo';

const TodoEl = ({onClick, todo}) => (
  <li
    onClick={onClick}
    style={{
      textDecoration: todo.data.done ? 'line-through' : 'none'
    }}
  >
    {todo.data.name}
  </li>
);

TodoEl.propTypes = {
  onClick: PropTypes.func.isRequired,
  todo: PropTypes.instanceOf(Todo).isRequired
};

export default TodoEl;
