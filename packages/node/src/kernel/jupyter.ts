import { createLogger } from 'bunyan'
import { KernelMessage, KernelAPI, KernelManager, Kernel, KernelSpecAPI } from '@jupyterlab/services'
import { ISessionOptions } from '@jupyterlab/services/lib/session/session'
import { KernelBase, ResultsCallback } from './kernel'
import {
    IExecuteResultOutput,
    IMimeBundle,
    IStreamOutput,
    IDiaplayOutput,
    IClearOutput,
    IErrorOutput,
    IStatusOutput,
    ICellState,
    ICodeCell,
    IKernelSpecs,
    isExecuteResultOutput,
    isStreamOutput,
    IExportVarPayload,
    IexportVarOutput,
    IexportdVarMapValue,
    isErrorOutput,
    isStatusOutput,
    ICellOutput,
} from '@bayesnote/common/lib/types'
import { formatStreamText, concatMultilineStringOutput } from '../utils/common'
import { ISpecModel } from '@jupyterlab/services/lib/kernelspec/restapi'
import cloneDeep from 'lodash/cloneDeep'
import { Translator } from '../translator'

const log = createLogger({ name: 'Kernel' })

export interface IJupyterKernel {
    kernels(): Promise<IKernelSpecs>
    runningKernels(): void
    shutdownAllKernel(): void
    execute(cell: ICodeCell, onResults: ResultsCallback): Promise<boolean>
    interrupt(cell: ICodeCell): void
    exportVar(payload: IExportVarPayload): Promise<IexportVarOutput>
    importVar(payload: IexportdVarMapValue): Promise<boolean>
}

export class JupyterKernel extends KernelBase implements IJupyterKernel {
    name = 'Jupyter'
    kernel: Kernel.IKernelConnection | undefined
    translator: Translator

    constructor() {
        super()
        this.translator = new Translator()
    }

    // kernel handler
    async runningKernels() {
        return KernelAPI.listRunning()
    }
    private async shutdownKernel(id: string) {
        return KernelAPI.shutdownKernel(id)
    }
    async shutdownAllKernel() {
        const kernels = await this.runningKernels()
        const promises = kernels.map((kernel) => this.shutdownKernel(kernel.id))
        return Promise.all(promises)
    }
    private async isKernelRunning(name: string) {
        const kernels = await this.runningKernels()
        const runningKernel = kernels.findIndex((kernel) => kernel.name === name)
        return runningKernel !== -1
    }
    private async getRunningKernel(name: string) {
        const kernels = await this.runningKernels()
        return kernels.find((kernel) => kernel.name === name)
    }
    private async startNewKernel(name: string) {
        return KernelAPI.startNew({ name })
    }
    private async getKernelInfo() {
        return this.kernel?.info
    }
    private async startKernel(name: string) {
        let kernel
        if (await this.isKernelRunning(name)) {
            kernel = await this.getRunningKernel(name)
        } else {
            kernel = await this.startNewKernel(name)
        }
        return kernel
    }
    private async connectToKernel(model: KernelAPI.IModel) {
        return await new KernelManager().connectTo({ model })
    }
    async switchToKernel(name: string) {
        const kernel = await this.startKernel(name)
        if (kernel) {
            this.kernel = await this.connectToKernel(kernel)
        }
    }
    private async switchKernelIfNeeded(cell: ICodeCell) {
        const currentKernel = await this.kernel?.info
        const currentKernelName = currentKernel?.language_info.name
        const cellKernelName = cell.kernelName // todo not language but name
        if (currentKernelName !== cellKernelName) {
            await this.switchToKernel(cellKernelName)
            const info = await this.getKernelInfo()
            log.info('switch to kernel: ', info?.language_info.name)
        }
    }

    async init(opts?: ISessionOptions) {
        return this
    }

    // result handler
    private handleResult(msg: KernelMessage.IIOPubMessage) {
        try {
            // todo status message
            if (KernelMessage.isExecuteResultMsg(msg)) {
                return this.handleExecuteResult(msg as KernelMessage.IExecuteResultMsg)
            } else if (KernelMessage.isStreamMsg(msg)) {
                return this.handleStreamMesssage(msg as KernelMessage.IStreamMsg)
            } else if (KernelMessage.isDisplayDataMsg(msg)) {
                return this.handleDisplayData(msg as KernelMessage.IDisplayDataMsg)
            } else if (KernelMessage.isClearOutputMsg(msg)) {
                return this.handleClearOutput(msg as KernelMessage.IClearOutputMsg)
            } else if (KernelMessage.isStatusMsg(msg)) {
                return this.handleStatusMessage(msg as KernelMessage.IStatusMsg)
            } else if (KernelMessage.isErrorMsg(msg)) {
                return this.handleError(msg as KernelMessage.IErrorMsg)
            } else {
                log.warn(`Unknown message ${msg.header.msg_type} : hasData=${'data' in msg.content}`)
            }
        } catch (err) {
            log.error('JupyterMessage -> handleIOPub -> err', err)
        }
    }

    private handleExecuteResult(msg: KernelMessage.IExecuteResultMsg): IExecuteResultOutput {
        return {
            type: 'result',
            data: msg.content.data as IMimeBundle,
        }
    }

    private handleStreamMesssage(msg: KernelMessage.IStreamMsg): IStreamOutput {
        const serializedText = formatStreamText(concatMultilineStringOutput(msg.content.text))
        return {
            type: 'stream',
            name: msg.content.name,
            text: serializedText,
        }
    }

    private handleDisplayData(msg: KernelMessage.IDisplayDataMsg): IDiaplayOutput {
        return {
            type: 'display',
            data: msg.content.data as IMimeBundle,
        }
    }

    private handleClearOutput(msg: KernelMessage.IClearOutputMsg): IClearOutput {
        return {
            type: 'clear',
        }
    }

    private handleError(msg: KernelMessage.IErrorMsg): IErrorOutput {
        // todo different from zeppelin
        return {
            type: 'error',
            ename: msg.content.ename,
            evalue: msg.content.evalue,
            traceback: msg.content.traceback,
        }
    }

    private handleStatusMessage(msg: KernelMessage.IStatusMsg): IStatusOutput {
        let state
        if (msg.content.execution_state === 'idle') {
            state = ICellState.Finished
        } else if (msg.content.execution_state === 'busy') {
            state = ICellState.Running
        } else {
            state = ICellState.Error
        }
        return {
            type: 'status',
            state,
        }
    }

    private ifFinished(reply: ICellOutput): boolean {
        let bool = false
        if (isStatusOutput(reply)) {
            if ((reply as IStatusOutput).state === ICellState.Finished) {
                bool = true
            }
        }
        return bool
    }

    // repl
    private async exportRepl(exportVarPayload: IExportVarPayload, codeToExecute: string): Promise<string> {
        return new Promise(async (res, rej) => {
            const tempCell = cloneDeep(exportVarPayload.exportCell)
            tempCell.source = codeToExecute
            let dataString: string
            const handleSuccess = (dataString: string) => {
                // get text/plain data from the first output
                log.info('export repel execute jsonData: ', dataString.length)
                dataString && res(dataString)
            }
            await this.execute(tempCell, (output) => {
                if (isExecuteResultOutput(output)) {
                    dataString = ((output as IExecuteResultOutput).data as any)['text/plain']
                    handleSuccess(dataString)
                }
                if (isStreamOutput(output)) {
                    dataString = (output as IStreamOutput).text
                    handleSuccess(dataString)
                }
                if (isErrorOutput(output)) {
                    log.info('export repl get error output')
                    rej(output)
                }
            })
        })
    }

    private async importRepl(exportdMapValue: IexportdVarMapValue, codeToExecute: string): Promise<string> {
        return new Promise(async (res, rej) => {
            const { importCell } = exportdMapValue.payload
            if (!importCell) {
                rej() // ignore
                return
            }
            const tempCell = cloneDeep(importCell)
            tempCell.source = codeToExecute
            let dataString: string
            const handleSuccess = (dataString: string) => {
                // get text/plain data from the first output
                log.info('import repel execute jsonData: ', dataString.length)
                dataString && res(dataString)
            }
            await this.execute(tempCell, (output) => {
                if (isExecuteResultOutput(output)) {
                    dataString = ((output as IExecuteResultOutput).data as any)['text/plain']
                    handleSuccess(dataString)
                }
                if (isStreamOutput(output)) {
                    dataString = (output as IStreamOutput).text
                    handleSuccess(dataString)
                }
                if (isErrorOutput(output)) {
                    log.info('import repl get error output')
                    rej(output)
                }
            })
        })
    }

    // execute
    async execute(cell: ICodeCell, onResults: ResultsCallback) {
        log.info('jupyter execute cell')
        await this.switchKernelIfNeeded(cell)
        const future = this.kernel?.requestExecute({ code: cell.source })
        return new Promise<boolean>((res, rej) => {
            if (future) {
                future.onIOPub = (message) => {
                    const reply = this.handleResult(message)
                    reply && onResults(reply)
                    if (reply && this.ifFinished(reply)) {
                        res(true)
                    }
                }
                // todo other message
                // future.onReply = message => {
                //     let reply = this.handleResult(message)
                //     reply && onResults(reply)
                // };
                // future.onStdin = message => {
                //     let reply = this.handleResult(message)
                //     reply && onResults(reply)
                // };
            }
        })
    }

    // interrupt
    async interrupt(cell: ICodeCell) {
        const kernel = await this.getRunningKernel(cell.kernelName)
        if (kernel?.id) {
            log.info('interrupt kernel id: ', kernel.id)
            KernelAPI.interruptKernel(kernel.id)
        }
    }

    // list all kernels
    async kernels() {
        const specs = await KernelSpecAPI.getSpecs()
        if (specs && specs.kernelspecs) {
            const kernels = []
            for (const val of Object.values(specs.kernelspecs)) {
                const { display_name: displayName, language, name } = val as ISpecModel
                kernels.push({ displayName, language, name, backend: this.name })
            }
            return kernels
        } else {
            return []
        }
    }

    // export variable
    private prepareexportCode(exportVarPayload: IExportVarPayload) {
        const language = exportVarPayload.exportCell.language
        const kernelName = exportVarPayload.exportCell.kernelName
        const variable = exportVarPayload.exportVar
        const tempVarName = 'temp_unified_notebook_var'
        const code = this.translator.translateToJSONExportCode(language, kernelName, variable, tempVarName)
        console.log('JupyterKernel -> prepareexportCode -> code', code)
        return code
    }

    // import variable
    private prepareImportCode(exportdMapValue: IexportdVarMapValue): string {
        const language = exportdMapValue.payload.importCell?.language
        const kernelName = exportdMapValue.payload.importCell?.kernelName
        const variableRename = exportdMapValue.payload.importVarRename
        const jsonData = exportdMapValue.jsonData
        if (!language || !variableRename || !jsonData || !kernelName) return ''
        const code = this.translator.translateFromJSONImportCode(language, kernelName, jsonData, variableRename)
        return code
    }

    async exportVar(exportVarPayload: IExportVarPayload) {
        const codeToExecute = this.prepareexportCode(exportVarPayload)
        const output = await this.exportRepl(exportVarPayload, codeToExecute)
        const exportVarOutput: IexportVarOutput = output
        return exportVarOutput
    }

    async importVar(exportdMapValue: IexportdVarMapValue) {
        const codeToExecute = this.prepareImportCode(exportdMapValue)
        const output = await this.importRepl(exportdMapValue, codeToExecute).catch(log.error)
        if (!output) return false

        let flag = false
        if (output.trim() === 'ok') {
            flag = true
        }
        log.info('jupyter import variable status: ', flag)
        return flag
    }
}
