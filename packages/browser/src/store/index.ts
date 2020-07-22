import { combineReducers, createStore } from "redux";
import { chartListReducer, chartReducer, dashboardReducer, flowReducer, notebookReducer } from "./reducer";

export const rootReducer = combineReducers({
  notebookReducer: notebookReducer,
  flowReducer: flowReducer,
  chartReducer: chartReducer,
  chartListReducer: chartListReducer,
  dashboardReducer: dashboardReducer
}
);

export const store = createStore(rootReducer,
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
  (window as any).__REDUX_DEVTOOLS_EXTENSION__())

export type RootState = ReturnType<typeof rootReducer>