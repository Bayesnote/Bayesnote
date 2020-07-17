import { combineReducers, createStore } from "redux";
import { flowReducer, notebookReducer } from "./reducer";

export const rootReducer = combineReducers({
  notebookReducer,
  flowReducer
}
);

export const store = createStore(rootReducer,
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
  (window as any).__REDUX_DEVTOOLS_EXTENSION__())