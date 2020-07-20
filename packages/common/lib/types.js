"use strict";
//TODO: Refactor. The abstraction is way too complicated.
Object.defineProperty(exports, "__esModule", { value: true });
var NotebookStatus;
(function (NotebookStatus) {
    NotebookStatus[NotebookStatus["RUNNING"] = 1] = "RUNNING";
    NotebookStatus[NotebookStatus["IDLE"] = 2] = "IDLE";
})(NotebookStatus = exports.NotebookStatus || (exports.NotebookStatus = {}));
function isNotebookRunning(status) {
    return status === NotebookStatus.RUNNING;
}
exports.isNotebookRunning = isNotebookRunning;
function isNotebookIdle(status) {
    return status === NotebookStatus.IDLE;
}
exports.isNotebookIdle = isNotebookIdle;
// cell state
var ICellState;
(function (ICellState) {
    ICellState[ICellState["Running"] = 1] = "Running";
    ICellState[ICellState["Finished"] = 2] = "Finished";
    ICellState[ICellState["Error"] = 3] = "Error";
})(ICellState = exports.ICellState || (exports.ICellState = {}));
// celltype
var CellType;
(function (CellType) {
    CellType["CODE"] = "code";
    CellType["MARKDOWN"] = "markdown";
    CellType["PARAMETER"] = "parameter";
    CellType["INJECTED_PARAMETER"] = "injected_parameter";
})(CellType = exports.CellType || (exports.CellType = {}));
;
function isExecuteResultOutput(msg) {
    return msg.type === 'result';
}
exports.isExecuteResultOutput = isExecuteResultOutput;
function isStatusOutput(msg) {
    return msg.type === 'status';
}
exports.isStatusOutput = isStatusOutput;
function isStreamOutput(msg) {
    return msg.type === 'stream';
}
exports.isStreamOutput = isStreamOutput;
function isErrorOutput(msg) {
    return msg.type === 'error';
}
exports.isErrorOutput = isErrorOutput;
function isClearOutput(msg) {
    return msg.type === 'clear';
}
exports.isClearOutput = isClearOutput;
function isParameterCell(cell) {
    return cell.type === CellType.PARAMETER;
}
exports.isParameterCell = isParameterCell;
function isInjectedParameterCell(cell) {
    return cell.type === CellType.INJECTED_PARAMETER;
}
exports.isInjectedParameterCell = isInjectedParameterCell;
