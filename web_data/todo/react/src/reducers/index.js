import {combineReducers} from 'redux';
import todos from './todos';
import visibilityFilter from './visibilityFilter';
import subscription from './subscription';

const todoApp = combineReducers({
  todos,
  visibilityFilter,
  subscription
});

export default todoApp;
