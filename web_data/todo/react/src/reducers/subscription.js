import Nymph from "Nymph";
import Todo from "Todo";
import {updateTodos, updateUserCount} from '../actions';

const todos = (state = {subscription: null, userCount: null}, action) => {
  switch (action.type) {
    case 'SUBSCRIBE':
      if (state.subscription) {
        state.subscription.unsubscribe();
      }
      let archived = action.archived;
      let subscription = Nymph.getEntities({"class": 'Todo'}, {"type": archived ? '&' : '!&', "tag": 'archived'}).subscribe((newTodos) => {
        action.asyncDispatch(updateTodos(newTodos, archived));
      }, null, (count) => {
        action.asyncDispatch(updateUserCount(count));
      });
      return {...state, subscription};
    case 'UPDATE_USER_COUNT':
      return {...state, userCount: action.userCount};
    default:
      return state;
  }
};

export default todos;
