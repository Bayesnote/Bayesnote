import {
  ICodeCell,
  IexportdVarMap, IKernelSpecs, INotebook
} from "@bayesnote/common/lib/types";
import { produce } from "immer";
import GridLayout from "react-grid-layout";
import { AnyMark } from "vega-lite/build/src/mark";
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { createEmptyCodeCellVM } from "./utils";

type IAction = {
  type: string;
  payload?: any;
};
export type IState = {
  notebookVM: INotebook;
  kernels: IKernelSpecs;
  exportdVarMap: IexportdVarMap;
};

const initialState: IState = {
  notebookVM: {
    cells: [createEmptyCodeCellVM()],
    name: ""
  },
  kernels: [],
  exportdVarMap: {},
};

export const notebookReducer = (state = initialState, action: IAction) => {
  switch (action.type) {
    // notebook
    case "loadNotebook":
      return produce(state, (draft) => {
        draft.notebookVM.cells = action.payload.cells;
      });
    case "updateNotebookName":
      return produce(state, (draft) => {
        draft.notebookVM.name = action.payload.name;
      });
    case "clearAllOutputs":
      return produce(state, (draft) => {
        draft.notebookVM.cells.forEach(
          (cell) => (cell.outputs = [])
        );
      });

    // cell
    case "addCell":
      return produce(state, (draft) => {
        draft.notebookVM.cells.push(createEmptyCodeCellVM());
      });

    case "updateCells":
      return produce(state, (draft) => {
        draft.notebookVM.cells = action.payload;
      });

    // cellVM
    //TODO: ?
    case "updateCellSource":
      return produce(state, (draft) => {
        draft.notebookVM.cells[
          findCellIndex(action.payload.cellVM)
        ].source = action.payload.source;
      });

    //TODO:
    // case "updateCellExported":
    //   return produce(state, (draft) => {
    //     draft.notebookVM.cells[
    //       findCellIndex(action.payload.cellVM)
    //     ].exportd = action.payload.exportd;
    //   });

    case "updateCellOutputs":
      return produce(state, (draft) => {
        draft.notebookVM.cells[
          findCellIndex(action.payload.cellVM)
        ].outputs = action.payload.msg;
      });

    case "appendCellOutputs":
      return produce(state, (draft) => {
        draft.notebookVM.cells[
          findCellIndex(action.payload.cellVM)
        ].outputs.push(action.payload.msg);
      });

    case "updateCellState":
      return produce(state, (draft) => {
        draft.notebookVM.cells[
          findCellIndex(action.payload.cellVM)
        ].state = action.payload.state;
      });

    case "clearCellOutput":
      return produce(state, (draft) => {
        draft.notebookVM.cells[
          findCellIndex(action.payload.cellVM)
        ].outputs = [];
      });

    case "changeCellType":
      return produce(state, (draft) => {
        draft.notebookVM.cells[
          findCellIndex(action.payload.cellVM)
        ].type = action.payload.type;
      });

    case "changeCellLanguage":
      return produce(state, (draft) => {
        let cell =
          draft.notebookVM.cells[findCellIndex(action.payload.cellVM)];
        let { languageWithBackend } = action.payload;
        cell.language = languageWithBackend.language;
        cell.kernelName = languageWithBackend.kernelName;
        cell.backend = languageWithBackend.backend;
      });

    // kernel
    case "updateKernels":
      return produce(state, (draft) => {
        draft.kernels = action.payload;
      });

    // exportd
    case "uploadexportdVarMap":
      return produce(state, (draft) => {
        draft.exportdVarMap = action.payload;
      });
    default:
      return state;
  }

  function findCellIndex(cellVM: ICodeCell) {
    const index = state.notebookVM.cells.findIndex(
      (cell) => cell.id === cellVM.id
    );
    return index;
  }
};

//TODO: Use separate reducer for flow?
export type FlowState = {
  flow: string
};

const flowInitState: FlowState = {
  flow: ""
};

export const flowReducer = (state = flowInitState, action: IAction) => {
  switch (action.type) {
    // notebook
    case "updateFlow":
      return action.payload
    default:
      return state;
  }
}

//TODO:
var initSpec: TopLevelUnitSpec = {
  width: 400,
  height: 300,
  title: " ",
  autosize: {
    "type": "fit",
    "contains": "padding"
  },
  mark: "bar" as AnyMark,
  data: { values: "", format: { type: "json" } },
  encoding: {
    "x": { "field": "", "type": "ordinal" },
    "y": { "field": "", "type": "quantitative" },
    "color": { "field": "", "type": "ordinal" }
  },
};

export type ChartState = {
  data: string,
  spec: TopLevelUnitSpec
};

const chartInitState: ChartState = {
  data: "",
  spec: initSpec
}

export const chartReducer = (state = chartInitState, action: IAction) => {
  switch (action.type) {
    case "data":
      return produce(state, (draft) => {
        //TODO:
        draft.spec.data = { values: action.payload.data, format: { type: "json" } };
      })
    case "spec":
      return produce(state, (draft) => {
        draft.spec = action.payload;
      })
    case 'title':
      return produce(state, (draft) => {
        draft.spec.title = action.payload.val;
      })
    case 'mark':
      return produce(state, (draft) => {
        draft.spec.mark = action.payload.val;
      })
    case 'x':
      return produce(state, (draft) => {
        (draft.spec.encoding!.x! as any).field = action.payload.val;
      })
    case 'xtype':
      return produce(state, (draft) => {
        (draft.spec.encoding!.x! as any).type = action.payload.val;
      })
    case 'y':
      return produce(state, (draft) => {
        (draft.spec.encoding!.y! as any).field = action.payload.val;
      })
    case 'ytype':
      return produce(state, (draft) => {
        (draft.spec.encoding!.y! as any).type = action.payload.val;
      })
    case 'color':
      return produce(state, (draft) => {
        (draft.spec.encoding!.color! as any).field = action.payload.val;
      })
    case 'changeStyle':
      return produce(state, (draft) => {
        draft.spec.width = action.payload.width;
        draft.spec.height = action.payload.height;
      })
    default:
      return state;
  }
}

export type ChartListState = {
  specs: TopLevelUnitSpec[]
};

const chartListInitState: ChartListState = {
  specs: [] as TopLevelUnitSpec[]
}

export const chartListReducer = (state = chartListInitState, action: IAction) => {
  switch (action.type) {
    case "saveChart":
      return produce(state, (draft) => {
        //TODO: Failed to update chart
        draft.specs.push(action.payload.val as TopLevelUnitSpec)
      })
    default:
      return state;
  }
}

export type dashboardState = {
  charts: string[]
  layouts: GridLayout.Layout[]
};

const dashbaordInitState = {
  //Pointer to charts
  charts: [] as number[],
  layouts: [] as GridLayout.Layout[]
}

export const dashboardReducer = (state = dashbaordInitState, action: IAction) => {
  switch (action.type) {
    case "addChart":
      return produce(state, (draft) => {
        //This should be updated if chart updated
        draft.charts.push(action.payload.val)
      })
    case "setLayouts":
      return produce(state, (draft) => {
        draft.layouts = action.payload.val as GridLayout.Layout[]
      })
    case "showBoard":
      return produce(state, (draft) => {
        draft.charts = action.payload.dashboard
        draft.layouts = action.payload.layouts
      })
    default:
      return state
  }
}

export type dashboardListState = {
  titles: string[],
  dashboards: any,
  layouts: GridLayout.Layout[],
}

const dashbaordListInitState = {
  titles: [] as string[],
  dashboards: [] as any[],
  layouts: [] as GridLayout.Layout[]
}

//TODO: debug
export const dashboardListReducer = (state = dashbaordListInitState, action: IAction) => {
  switch (action.type) {
    case "saveDashboard":
      return produce(state, (draft) => {
        //TODO: simplify
        draft.titles.push(action.payload.title)
        draft.dashboards.push(action.payload.dashboard)
        draft.layouts.push(action.payload.layouts)  //empty
      })
    default:
      return state
  }
}

