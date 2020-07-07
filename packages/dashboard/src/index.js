import React from "react";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from "react-redux";
import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import thunk from 'redux-thunk';
import data from "vega-datasets";
import App from "./App";

//actions
const EDIT_TITLE = "EDIT_TITLE";
const EDIT_CHART = "EDIT_CHART";
const EDIT_X = "EDIT_X";
const EDIT_Y = "EDIT_Y";
const EDIT_DATA = "EDIT_DATA";
const EDIT_XTYPE = "EDIT_XTYPE";
const EDIT_YTYPE = "EDIT_YTYPE";
const EDIT_COLOR = "EDIT_COLOR";
const SAVE_SPEC = "SAVE_SPEC";
const SET_SPEC = "SET_SPEC";
const CHANGE_STYLE = "CHANGE_STYLE"
const ADD_CHART = "ADD_CHART"
const SET_LAYOUTS = "SET_LAYOUTS"
const SAVE_DASHBOARD = "SAVE_DASHBOARD"
const SET_DASHBOARD = "SET_DASHBOARD"

//action creator
export function editTitle(title: string) {
  return {
    type: EDIT_TITLE,
    title
  };
}

export function editChart(chartType) {
  return {
    type: EDIT_CHART,
    chartType
  };
}

export function editX(x) {
  return {
    type: EDIT_X,
    x
  };
}

export function editY(y) {
  return {
    type: EDIT_Y,
    y
  };
}

export function editColor(color) {
  return {
    type: EDIT_COLOR,
    color
  };
}

export function editData(name) {
  return {
    type: EDIT_DATA,
    name: name,
    url: data[name].url
  };
}

export function editXType(XType) {
  return {
    type: EDIT_XTYPE,
    fieldType: XType
  };
}

//TODO: one action ?
export function editYType(YType) {
  return {
    type: EDIT_YTYPE,
    fieldType: YType
  };
}

export function saveSpec(spec) {
  return {
    type: SAVE_SPEC,
    spec: spec
  };
}

export function setSpec(spec) {
  return {
    type: SET_SPEC,
    spec: spec
  };
}

export function changeStyle(width, height) {
  return {
    type: CHANGE_STYLE,
    width: width,
    height: height
  }
}

export function addChart(chart) {
  return {
    type: ADD_CHART,
    chart: chart,
  }
}

export function setLayouts(layouts) {
  return {
    type: SET_LAYOUTS,
    layouts: layouts
  }
}

//dashboard = chart[]
export function saveDashboard(dashboard, layouts, title) {
  return {
    type: SAVE_DASHBOARD,
    dashboard: dashboard,
    layouts: layouts,
    title: title
  }
}

export function setDashboard(dashboard, layouts) {
  return {
    type: SET_DASHBOARD,
    dashboard: dashboard,
    layouts: layouts
  }
}

//TODO: remove this initial data
var specData = {
  autosize: {
    type: "fit",
    resize: true,
    contains: "padding"
  },
  mark: "auto",
  encoding: {
    x: { field: "" },
    y: { field: "" },
    color: { field: "" }
  },
  data: { url: "" },
};

//TODO: remove data?
const INITIAL_STATE = { spec: specData };

//reducer
function chartReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case EDIT_TITLE:
      return { ...state, spec: { ...state.spec, title: action.title } };
    case EDIT_CHART:
      return { ...state, spec: { ...state.spec, mark: action.chartType } };
    case EDIT_X:
      return {
        ...state,
        spec: {
          ...state.spec,
          encoding: { ...state.spec.encoding, x: { field: action.x } }
        }
      };
    case EDIT_XTYPE:
      return {
        ...state,
        spec: {
          ...state.spec,
          encoding: {
            ...state.spec.encoding,
            x: { ...state.spec.encoding.x, type: action.fieldType }
          }
        }
      };
    case EDIT_Y:
      return {
        ...state,
        spec: {
          ...state.spec,
          encoding: { ...state.spec.encoding, y: { field: action.y } }
        }
      };
    case EDIT_YTYPE:
      return {
        ...state,
        spec: {
          ...state.spec,
          encoding: {
            ...state.spec.encoding,
            y: { ...state.spec.encoding.y, type: action.fieldType }
          }
        }
      };
    case EDIT_COLOR:
      return {
        ...state,
        spec: {
          ...state.spec,
          encoding: { ...state.spec.encoding, color: { field: action.color } }
        }
      };
    case EDIT_DATA:
      return {
        ...state,
        spec: { ...state.spec, data: { name: action.name, url: action.url } }
      };
    case SET_SPEC:
      return { spec: action.spec }
    case CHANGE_STYLE:
      return {
        ...state,
        spec: { ...state.spec, width: action.width, height: action.height }
      }
    default:
      return state;
  }
}

function chartListReducer(state = [], action) {
  switch (action.type) {
    case SAVE_SPEC:
      return [...state, action.spec];
    default:
      return state;
  }
}

//chart + layout
//TODO: need index to update layout
function dashboardListReducer(state = { dashboards: [], layouts: [], titles: [] }, action) {
  switch (action.type) {
    case SAVE_DASHBOARD:
      return { dashboards: [...state.dashboards, action.dashboard], layouts: [...state.layouts, action.layouts], titles: [...state.titles, action.title] }
    default:
      return state
  }
}

//todo: rename charts => dashboard?
function dashboardReducer(state = { charts: [], layouts: [] }, action) {
  switch (action.type) {
    case ADD_CHART:
      return {
        ...state,
        charts: [...state.charts, action.chart]
      }
    case SET_LAYOUTS:
      return {
        ...state,
        layouts: action.layouts
      }
    case SET_DASHBOARD:
      return {
        charts: action.dashboard,
        layouts: action.layouts
      }
    default:
      return state
  }
}

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('state', serializedState);
  } catch {
    // ignore write errors
  }
};

const rootReducer = combineReducers({ chartReducer: chartReducer, chartListReducer: chartListReducer, dashboardReducer: dashboardReducer, dashboardListReducer: dashboardListReducer });

const initStore = () => {
  const windowGlobal = typeof window !== 'undefined' && window

  const devtools =
    process.env.NODE_ENV === 'development' && windowGlobal.devToolsExtension
      ? window.__REDUX_DEVTOOLS_EXTENSION__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__()
      : f => f;

  const store = createStore(
    rootReducer,
    loadState(),
    compose(
      applyMiddleware(thunk),
      devtools,
    )
  );

  return store;
};

export const store = initStore()

export const wrapper = ({ element }) => {
  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        {element}
      </DndProvider>
    </Provider>
  )
}

store.subscribe(() => {
  saveState({
    chartListReducer: store.getState().chartListReducer
  });
});

const IndexPage = () => (<App />)

export default IndexPage
t 