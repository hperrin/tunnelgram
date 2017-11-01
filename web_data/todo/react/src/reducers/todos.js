import Nymph from "Nymph";
import Todo from "Todo";

const todos = (state = {todos: [], archived: false}, action) => {
  switch (action.type) {
    case 'UPDATE_TODOS':
      if (action.todos === undefined) {
        return state;
      }
      let todos = state.todos.slice();
      let archived = action.archived;
      Nymph.updateArray(todos, action.todos);
      // Nymph.sort(todos, this.get('uiSort'));
      return {...state, todos, archived};
    case 'ADD_TODO':
      let todo = new Todo();
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

export default todos;
