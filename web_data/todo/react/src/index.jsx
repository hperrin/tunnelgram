import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import todoApp from './reducers';
import asyncDispatchMiddleware from './middleware/AsyncDispatch';
import {subscribe} from './actions'
import App from './components/App';

let store = createStore(
  todoApp,
  applyMiddleware(asyncDispatchMiddleware)
);

store.dispatch(subscribe(false));

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('todoApp')
);
