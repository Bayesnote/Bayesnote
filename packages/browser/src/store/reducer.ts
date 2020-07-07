import {
  INotebookViewModel,
  IKernelSpecs,
  ICellViewModel,
  IexportdVarMap,
} from "@bayesnote/common/lib/types";
import { createEmptyCodeCellVM } from "./utils";
import { produce } from "immer";

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
