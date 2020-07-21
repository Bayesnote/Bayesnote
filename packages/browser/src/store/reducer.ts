import {
  ICellViewModel,
  IexportdVarMap, IKernelSpecs, INotebookViewModel
} from "@bayesnote/common/lib/types";
import { produce } from "immer";
import { AnyMark } from "vega-lite/build/src/mark";
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { createEmptyCodeCellVM } from "./utils";

type IAction = {
  type: string;
  payload?: any;
};
export type IState = {
  notebookVM: INotebookViewModel;
  kernels: IKernelSpecs;
  exportdVarMap: IexportdVarMap;
};

const initialState: IState = {
  notebookVM: {
    notebook: {
      cells: [createEmptyCodeCellVM()],
    },
  },
  kernels: [],
  exportdVarMap: {},
};

export const notebookReducer = (state = initialState, action: IAction) => {
  switch (action.type) {
    // notebook
    case "loadNotebook":
      return produce(state, (draft) => {
        draft.notebookVM.notebook = action.payload.notebook;
      });

    case "clearAllOutputs":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells.forEach(
          (cell) => (cell.cell.outputs = [])
        );
      });

    // cell
    case "addCell":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells.push(createEmptyCodeCellVM());
      });

    case "updateCells":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells = action.payload;
      });

    // cellVM
    //TODO: ?
    case "updateCellSource":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells[
          findCellIndex(action.payload.cellVM)
        ].cell.source = action.payload.source;
      });

    case "updateCellExported":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells[
          findCellIndex(action.payload.cellVM)
        ].exportd = action.payload.exportd;
      });

    case "updateCellOutputs":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells[
          findCellIndex(action.payload.cellVM)
        ].cell.outputs = action.payload.msg;
      });

    case "appendCellOutputs":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells[
          findCellIndex(action.payload.cellVM)
        ].cell.outputs.push(action.payload.msg);
      });

    case "updateCellState":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells[
          findCellIndex(action.payload.cellVM)
        ].cell.state = action.payload.state;
      });

    case "clearCellOutput":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells[
          findCellIndex(action.payload.cellVM)
        ].cell.outputs = [];
      });

    case "changeCellType":
      return produce(state, (draft) => {
        draft.notebookVM.notebook.cells[
          findCellIndex(action.payload.cellVM)
        ].cell.type = action.payload.type;
      });

    case "changeCellLanguage":
      return produce(state, (draft) => {
        let cell =
          draft.notebookVM.notebook.cells[findCellIndex(action.payload.cellVM)]
            .cell;
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

  function findCellIndex(cellVM: ICellViewModel) {
    const index = state.notebookVM.notebook.cells.findIndex(
      (cell) => cell.cell.id === cellVM.cell.id
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

export type ChartState = {
  data: string,
  spec: TopLevelUnitSpec
};

//TODO:
var initSpec: TopLevelUnitSpec = {
  width: 300,
  title: "sdf",
  autosize: {
    "type": "fit",
    "contains": "padding"
  },
  mark: "bar" as AnyMark,
  data: { values: "", format: { type: "json" } },
  encoding: {
    "x": { "field": "Cylinders", "type": "ordinal" },
    "y": { "field": "Horsepower", "type": "quantitative" },
    "color": { "field": "Origin", "type": "ordinal" }
  },
};

const chartInitState: ChartState = {
  data: "",
  spec: initSpec
}

export const ChartReducer = (state = chartInitState, action: IAction) => {
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
    default:
      return state;
  }
}

