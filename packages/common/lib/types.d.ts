export interface INotebookViewModel {
    name?: string;
    notebook: INotebook;
}
export interface ICellViewModel {
    cell: ICell;
    exportd: string;
}
export interface INotebook {
    cells: ICellViewModel[];
}
export interface INotebookJSON {
    cells: ICell[];
}
export interface INotebookCallback {
    (payload: INotebookCallbackPayload): void;
}
export interface INotebookCallbackPayload {
    current: number;
    length: number;
    finish: boolean;
    notebookJSON?: INotebookJSON;
}
export declare type INotebookStatus = NotebookStatus;
export declare enum NotebookStatus {
    'RUNNING' = 1,
    'IDLE' = 2
}
export declare function isNotebookRunning(status: NotebookStatus): boolean;
export declare function isNotebookIdle(status: NotebookStatus): boolean;
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
    metadata: ICellMetadata;
    outputs: ICellOutput[];
    state: ICellState;
}
export declare type ICell = ICodeCell;
export declare enum ICellState {
    "Running" = 1,
    "Finished" = 2,
    "Error" = 3
}
export interface ICellMetadata {
    scrollbar: boolean;
    source_hidden: boolean;
    output_hidden: boolean;
}
export declare enum CellType {
    CODE = "code",
    MARKDOWN = "markdown",
    PARAMETER = "parameter",
    INJECTED_PARAMETER = "injected_parameter"
}
export interface ICodeCell extends ICellBase {
    language: string;
    kernelName: string;
    backend: string;
}
export interface IMimeBundle {
    [key: string]: string;
}
export interface ICellOutput {
    type: ICellOutputType;
}
export declare type ICellOutputType = "stream" | "display" | "result" | "error" | "clear" | "status";
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
    state: ICellState;
}
export interface IErrorOutput extends ICellOutput {
    type: "error";
    ename: string;
    evalue: string;
    traceback: any;
}
export declare function isExecuteResultOutput(msg: ICellOutput): boolean;
export declare function isStatusOutput(msg: ICellOutput): boolean;
export declare function isStreamOutput(msg: ICellOutput): boolean;
export declare function isErrorOutput(msg: ICellOutput): boolean;
export declare function isClearOutput(msg: ICellOutput): boolean;
export declare function isParameterCell(cell: ICodeCell): boolean;
export declare function isInjectedParameterCell(cell: ICodeCell): boolean;
export interface IResponse {
    msg: ICellOutput;
    cell: ICell;
}
export interface IKernelSpec {
    language: string;
    name: string;
    displayName: string;
    backend: string;
}
export declare type IKernelSpecs = IKernelSpec[];
export declare type IKernelInfo = {
    language: string;
    kernelName: string;
    backend: string;
}[];
export interface IExportVarPayload {
    exportVar: string;
    exportCell: ICodeCell;
    importVarRename?: string;
    importCell?: ICodeCell;
}
export declare type IexportVarOutput = string;
export interface IexportdVarMap {
    [key: string]: IexportdVarMapValue;
}
export interface IexportdVarMapValue {
    id: string;
    payload: IExportVarPayload;
    jsonData?: IexportVarOutput;
}
