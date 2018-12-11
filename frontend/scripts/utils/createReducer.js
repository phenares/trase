import PropTypes from 'prop-types';
import reducerRegistry from 'scripts/reducer-registry';

export default function createReducer(name, initialState, reducers, getTypes) {
  function reducer(state = initialState, action) {
    const reducerMethod = reducers[action.type];
    const newState = typeof reducerMethod === 'undefined' ? state : reducerMethod(state, action);

    if (getTypes && NODE_ENV_DEV) {
      PropTypes.checkPropTypes(getTypes(PropTypes), newState, 'reducer prop', getTypes.name);
    }
    return newState;
  }
  reducerRegistry.register(name, reducer);
}
