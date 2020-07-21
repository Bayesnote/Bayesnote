import { combineReducers, createStore } from "redux";
import { chartListReducer, chartReducer, dashboardListReducer, dashboardReducer, flowReducer, notebookReducer } from "./reducer";

export const rootReducer = combineReducers({
  notebookReducer: notebookReducer,
  flowReducer: flowReducer,
  chartReducer: chartReducer,
  chartListReducer: chartListReducer,
  dashboardReducer: dashboardReducer,
  dashboardListReducer: dashboardListReducer,
}
);

export type RootState = ReturnType<typeof rootReducer>

const loadState = () => {
  const serializedState = localStorage.getItem('chartList');
  if (serializedState === null) {
    return undefined;
  }
  return JSON.parse(serializedState);
};

export const store = createStore(rootReducer, loadState(),
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
  (window as any).__REDUX_DEVTOOLS_EXTENSION__())

//Save chartListReducer to local storage
store.subscribe(() => {
  localStorage.setItem('chartList', JSON.stringify({ chartListReducer: store.getState().chartListReducer }))
})
