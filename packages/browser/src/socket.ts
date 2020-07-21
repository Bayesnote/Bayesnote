import {
  ICellOutput,
  IClearOutput, IErrorOutput, IExecuteResultOutput,
  IexportdVarMap, IexportdVarMapValue,
  IKernelSpecs,
  IResponse,
  isClearOutput, isErrorOutput, isExecuteResultOutput,
  isStatusOutput,
  isStreamOutput,
  IStatusOutput,
  IStreamOutput,
  ICodeCell
} from "@bayesnote/common/lib/types";
import socketClient from "socket.io-client";
import { store } from "./store";
import { getCurrentCellVM } from "./store/utils";

let client = socketClient("http://localhost:8890", { reconnection: true });
client.on("socketID", handleSocketID);
client.on("cell.run.ok", handleRunCellSuccess);
// client.on("notebook.run.progress", handleRunNotebookProgress);
// client.on("notebook.run.ok", handleRunNotebookSuccess);
client.on("kernel.list.ok", handleGetKernels);
client.on("kernel.running.list.ok", (res: any) => {
  console.log(JSON.stringify(res.map((item: any) => item.name)));
});
client.on("export.variable.ok", handleexportVariable);
client.on("export.variable.list.ok", handleexportVariableList);
client.on("export.variable.import.ok", (res: any) => {
  console.log("import variable: ", res);
});
client.on("nb.pong", () => console.log("pong"));

// event
// result
function handleSocketID(id: string) {
  console.log("handleSocketID -> id", id);
}

//TODO: dups?
//TODO: handle text/plain
function handleRunCellSuccess(res: IResponse) {
  let msg: ICellOutput = res.msg;
  let cell: ICodeCell = res.cell;
  if (isExecuteResultOutput(msg)) {
    handleExecuteResult(msg as IExecuteResultOutput, cell);
  } else if (isStatusOutput(msg)) {
    handleStatusOutput(msg as IStatusOutput, cell);
  } else if (isStreamOutput(msg)) {
    handleStreamOutput(msg as IStreamOutput, cell);
  } else if (isErrorOutput(msg)) {
    handleErrorOutput(msg as IErrorOutput, cell);
  } else if (isClearOutput(msg)) {
    handleClearOutput(msg as IClearOutput, cell);
  } else {
    console.warn(`Socket -> Unknown message ${JSON.stringify(msg)}. Called by cell ${cell.id}`);
  }
}

function handleExecuteResult(msg: IExecuteResultOutput, cell: ICodeCell) {
  store.dispatch({
    type: "updateCellOutputs",
    payload: { cellVM: getCurrentCellVM(cell), msg: [msg] },
  });
}

function handleStatusOutput(msg: IStatusOutput, cell: ICodeCell) {
  store.dispatch({
    type: "updateCellState",
    payload: { cellVM: getCurrentCellVM(cell), state: msg.state },
  });
}

function handleStreamOutput(msg: IStreamOutput, cell: ICodeCell) {
  store.dispatch({
    type: "appendCellOutputs",
    payload: { cellVM: getCurrentCellVM(cell), msg },
  });
}

function handleErrorOutput(msg: IErrorOutput, cell: ICodeCell) {
  store.dispatch({
    type: "appendCellOutputs",
    payload: { cellVM: getCurrentCellVM(cell), msg },
  });
}

function handleClearOutput(msg: IClearOutput, cell: ICodeCell) {
  store.dispatch({
    type: "clearCellOutput",
    payload: { cellVM: getCurrentCellVM(cell) },
  });
}

// notebook
// function handleRunNotebookProgress(payload: INotebookCallbackPayload) {
//   console.log("handleRunNotebookProgress -> payload", payload);
// }

// function handleRunNotebookSuccess(payload: INotebookCallbackPayload) {
//   console.log("handleRunNotebookSuccess -> payload", payload);
// }

// kernel
function handleGetKernels(msg: IKernelSpecs) {
  store.dispatch({ type: "updateKernels", payload: msg });
}

// export
function handleexportVariable(exportdVarMapValue: IexportdVarMapValue) {
  store.dispatch({
    type: "updateCellExported",
    payload: {
      cellVM: getCurrentCellVM(exportdVarMapValue.payload.exportCell),
      exportd: exportdVarMapValue.payload.exportVar,
    },
  });
  client.emit("export.variable.list");
}
function handleexportVariableList(exportdVarMap: IexportdVarMap) {
  console.log("handleexportVariableList -> exportdVarMap", exportdVarMap);
  store.dispatch({ type: "uploadexportdVarMap", payload: exportdVarMap });
}

export default client;
