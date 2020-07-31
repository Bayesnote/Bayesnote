//TODO: Refactor. The abstraction is way too complicated.
export interface INotebook {
    name?: string,
    cells: ICodeCell[]
}

//TODO: Incomplete
export enum NotebookStatus {
    'RUNNING' = 1,
    'IDLE'
}

export function isNotebookRunning(status: NotebookStatus) {
    return status === NotebookStatus.RUNNING
}

export function isNotebookIdle(status: NotebookStatus) {
    return status === NotebookStatus.IDLE
}

/* -------------------------------------------------------------------------- */
/*                                    cell                                    */
/* -------------------------------------------------------------------------- */
/**
 * id: cell uuid
 * type: code/markdown/parameter
 * source: user input value
 * metadata: define show/hide source/output and scrollbar in output
 * outputs: cell output list containing mime bundle data object
 * state: cell current state running/finished/error
 */
export interface ICellBase {
    id: string;
    type: CellType;
    source: string;
    metadata: ICellMetadata; //TODO: Remove
    outputs: ICellOutput[];
    state: ICellState;
}

export enum ICellState {
    "Running" = 1,
    "Finished",
    "Error",
}

// cell metadata
export interface ICellMetadata {
    scrollbar: boolean;
    source_hidden: boolean;
    output_hidden: boolean;
}

// celltype
export enum CellType {
    CODE = 'code',
    MARKDOWN = 'markdown',
};

// code cell
export interface ICodeCell extends ICellBase {
    language: string;
    kernelName: string;
    backend: string;
}

// code cell output
export interface IMimeBundle {
    [key: string]: string // text/plain text/html ...
}

export interface ICellOutput {
    type: ICellOutputType;
}

export type ICellOutputType = "stream" | "display" | "result" | "error" | "clear" | "status"; // zeppelin TEXT HTML IMAGE TABLE can be mimetype

export interface IStreamOutput extends ICellOutput {
    type: "stream";
    name: "stdout" | "stderr";
    text: string;
}

export interface IDiaplayOutput extends ICellOutput {
    type: "display";
    data: IMimeBundle;
}

export interface IClearOutput extends ICellOutput {
    type: "clear";
}

export interface IExecuteResultOutput extends ICellOutput {
    type: "result";
    data: IMimeBundle;
}

export interface IStatusOutput extends ICellOutput {
    type: "status";
    state: ICellState
}

export interface IErrorOutput extends ICellOutput {
    type: "error";
    ename: string;
    evalue: string;
    traceback: any; // todo
}

export function isExecuteResultOutput(msg: ICellOutput) {
    return msg.type === 'result'
}

export function isStatusOutput(msg: ICellOutput) {
    return msg.type === 'status'
}

export function isStreamOutput(msg: ICellOutput) {
    return msg.type === 'stream'
}

export function isErrorOutput(msg: ICellOutput) {
    return msg.type === 'error'
}

export function isClearOutput(msg: ICellOutput) {
    return msg.type === 'clear'
}

// socket response
export interface IResponse {
    msg: ICellOutput
    cell: ICodeCell
}

/* -------------------------------------------------------------------------- */
/*                                   Kernel                                   */
/* -------------------------------------------------------------------------- */
export interface IKernelSpec {
    language: string,
    name: string,
    displayName: string,
    backend: string
}
export type IKernelSpecs = IKernelSpec[]
export type IKernelInfo = {
    language: string,
    kernelName: string,
    backend: string
}[]

/* -------------------------------------------------------------------------- */
/*                                  exportVar                                 */
/* -------------------------------------------------------------------------- */
//TODO: refactor
export interface IExportVarPayload {
    exportVar: string;
    exportCell: ICodeCell;
    importVarRename?: string;
    importCell?: ICodeCell;
}
export type IexportVarOutput = string;
export interface IexportdVarMap {
    [key: string]: IexportdVarMapValue
}
export interface IexportdVarMapValue {
    id: string;
    payload: IExportVarPayload;
    jsonData?: IexportVarOutput;
}
