export const addTodo = name => {
  return {
    type: 'ADD_TODO',
    name
  };
};

export const setVisibilityFilter = filter => {
  return {
    type: 'SET_VISIBILITY_FILTER',
    filter
  };
};

export const toggleTodo = todo => {
  return {
    type: 'TOGGLE_TODO',
    todo
  };
};

export const subscribe = archived => {
  return {
    type: 'SUBSCRIBE',
    archived
  };
};

export const updateUserCount = userCount => {
  return {
    type: 'UPDATE_USER_COUNT',
    userCount
  };
};

export const updateTodos = (todos, archived) => {
  return {
    type: 'UPDATE_TODOS',
    todos,
    archived
  };
};
