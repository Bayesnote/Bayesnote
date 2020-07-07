import {
    IexportdVarMapValue,
    ICellOutput,
    ICodeCell,
    IKernelSpecs,
    IExportVarPayload,
    IexportVarOutput,
} from '@bayesnote/common/lib/types'

// results callback
export interface ResultsCallback {
    (output: ICellOutput): void
}

// kernel
export interface IKernelBase {
    name: string
    init(): void
    kernels(): Promise<IKernelSpecs>
    runningKernels(): void
    shutdownAllKernel(): void
    execute(cell: ICodeCell, onResults: ResultsCallback): Promise<boolean>
    interrupt(cell: ICodeCell): void
    exportVar(payload: IExportVarPayload): Promise<IexportVarOutput>
    importVar(payload: IexportdVarMapValue): Promise<boolean>
}

export class KernelBase implements IKernelBase {
    name = 'Name not implemented.'
    kernels(): Promise<IKernelSpecs> {
        throw new Error('Method not implemented.')
    }
    runningKernels(): void {
        throw new Error('Method not implemented.')
    }
    shutdownAllKernel(): void {
        throw new Error('Method not implemented.')
    }
    init() {
        throw new Error('Method not implemented.')
    }
    execute(cell: ICodeCell, onResults: ResultsCallback): Promise<boolean> {
        throw new Error('Method not implemented.')
    }
    interrupt(cell: ICodeCell): void {
        throw new Error('Method not implemented.')
    }
    exportVar(payload: IExportVarPayload): Promise<IexportVarOutput> {
        throw new Error('Method not implemented.')
    }
    importVar(payload: IexportdVarMapValue): Promise<boolean> {
        throw new Error('Method not implemented.')
    }
}
