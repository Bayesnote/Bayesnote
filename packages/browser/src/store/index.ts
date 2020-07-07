import { createStore } from "redux";
import { notebookReducer } from "./reducer";

export const store = createStore(
  notebookReducer,
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION__()
);
