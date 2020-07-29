import {
    CellType,
    ICell,
    ICellOutput,
    ICodeCell,
    IExecuteResultOutput,
    IKernelInfo,
    INotebookCallback,
    INotebookJSON,
    INotebookStatus,
    INotebookViewModel,
    IResponse,
    isClearOutput,
    isErrorOutput,
    isExecuteResultOutput,
    isNotebookIdle,
    isNotebookRunning,
    isStatusOutput,
    isStreamOutput,
    IStreamOutput,
    NotebookStatus,
} from '@bayesnote/common/lib/types'
import { createEmptyCodeCell } from '@bayesnote/common/lib/utils'
import { createLogger } from 'bunyan'
import jsonfile, { Path } from 'jsonfile'
import cloneDeep from 'lodash/cloneDeep'
import uniqBy from 'lodash/uniqBy'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { BackendManager } from './backend'

const log = createLogger({ name: 'NotebookManager' })

namespace File {
    //TODO: This is ugly
    export const read = (url: string): Promise<INotebookJSON> => {
        return new Promise((res, rej) => {
            const absUrl = path.resolve(__dirname, url)
            log.info('Read notebook: ', absUrl)
            jsonfile.readFile(absUrl, (err, data) => {
                if (err) {
                    rej(err)
                } else {
                    res(data)
                }
            })
        })
    }

    export const write = (notebookVM: INotebookViewModel) => {
        //TODO: handle name conflicts
        let fileName = 'Undefined'
        if (notebookVM.name) {
            fileName = notebookVM.name
        }
        const writePath: Path = path.resolve(`../../storage/` + fileName + `.json`)
        jsonfile.writeFile(writePath, notebookVM, function (err) {
            if (err) console.error(err)
            log.info('Notebook saved')
        })
    }
}

export interface INotebookManager {
    notebookJson: INotebookJSON | undefined
    loadNotebook(url: string): Promise<INotebookJSON | void>
    loadNotebookJSON(notebook: INotebookJSON): Promise<void>
    saveNotebook(notebook: INotebookViewModel): void
    prepareNotebook(parameters: string[], clean: boolean): Promise<void>
    runNotebook(notebookCallback: INotebookCallback, silent: boolean): Promise<boolean>
    runNotebookAsync(silent: boolean): Promise<string>
    getAsyncNotebookResult(id: string): INotebookJSON | undefined
    queryStatus(): INotebookStatus
    interrupt(): void
}

interface IStore {
    [key: string]: INotebookJSON | undefined
}

export class NotebookManager implements INotebookManager {
    notebookJson: INotebookJSON | undefined
    parameters: string[] = []
    backendManager: BackendManager
    notebookStatus: INotebookStatus = NotebookStatus.IDLE
    interruptSignal = false
    store: IStore = {}

    constructor(backendManager: BackendManager) {
        this.backendManager = backendManager
    }

    private handleRunCellSuccess(res: IResponse) {
        const msg: ICellOutput = res.msg
        const cell: ICell = res.cell
        if (isExecuteResultOutput(msg)) {
            this.handleExecuteResult(msg as IExecuteResultOutput, cell)
        } else if (isStatusOutput(msg)) {
            // handleStatusOutput(msg as IStatusOutput, cell)
        } else if (isStreamOutput(msg)) {
            this.handleStreamOutput(msg as IStreamOutput, cell)
        } else if (isErrorOutput(msg)) {
            // handleErrorOutput(msg as IErrorOutput, cell)
        } else if (isClearOutput(msg)) {
            // handleClearOutput(msg as IClearOutput, cell)
        } else {
            console.warn(`Unknown message ${msg.type} : called by cell ${cell.id}`)
        }
    }

    private handleExecuteResult(msg: IExecuteResultOutput, cell: ICell) {
        cell.outputs = [msg]
    }

    private handleStreamOutput(msg: IStreamOutput, cell: ICell) {
        cell.outputs.push(msg)
    }

    private getNotebookKernelInfo(cells: ICodeCell[]): IKernelInfo {
        let info = cells.map((cell) => ({
            language: cell.language,
            kernelName: cell.kernelName,
            backend: cell.backend,
        }))
        info = uniqBy(info, 'kernelName')
        return info
    }

    // notebook modifier
    private hasParameters = (parameters: string[]) => {
        return parameters && parameters.length
    }

    private findFirstInjectedParameterCellIndex = (notebook: INotebookJSON): number => {
        return notebook.cells.findIndex((cell) => cell.type === CellType.INJECTED_PARAMETER)
    }

    private findFirstParameterCellIndex = (notebook: INotebookJSON): number => {
        return notebook.cells.findIndex((cell) => cell.type === CellType.PARAMETER)
    }

    private hasParameterCell = (index: number) => {
        const flag = index !== -1
        log.info(`Has ${flag ? '' : 'no '}parameter cell`)
        return flag
    }

    private hasInjectedParameterCell = (index: number) => {
        const flag = index !== -1
        log.info(`Has ${flag ? '' : 'no '}injected parameter cell`)
        return flag
    }

    private prepareParameterCell = (parameters: string[]) => {
        log.info('Preparing parameter cell')
        const cell = createEmptyCodeCell()
        cell.type = CellType.INJECTED_PARAMETER
        cell.source = parameters.join('\n')
        cell.language = 'javascript'
        cell.backend = 'Jupyter'
        return cell
    }

    private injectParameterCell = (json: INotebookJSON, cell: ICodeCell, index: number) => {
        log.info('Injecting parameter cell')
        if (index > -1) {
            json.cells.splice(index + 1, 0, cell)
        } else {
            json.cells.unshift(cell)
        }
    }

    private replaceInjectedParameterCell = (json: INotebookJSON, cell: ICodeCell, index: number) => {
        json.cells.splice(index, 1, cell)
    }

    private handleParameters = (
        firstParameterCellIndex: number,
        firstInjectedParameterCellIndex: number,
        notebook: INotebookJSON,
        parameters: string[],
    ) => {
        log.warn('handle parameters', firstParameterCellIndex, firstInjectedParameterCellIndex, notebook, parameters)
        const cell = this.prepareParameterCell(parameters)
        this.hasParameterCell(firstParameterCellIndex)
        if (this.hasInjectedParameterCell(firstInjectedParameterCellIndex)) {
            // Replace it when notebook has injectedParameterCell
            this.replaceInjectedParameterCell(notebook, cell, firstInjectedParameterCellIndex)
        } else {
            // Inject it when notebook has no injectedParameterCell
            this.injectParameterCell(notebook, cell, firstParameterCellIndex)
        }
    }

    private cleanAllInjectedParameterCell = (notebook: INotebookJSON) => {
        notebook.cells = notebook.cells.filter((cell) => cell.type !== CellType.INJECTED_PARAMETER)
    }

    // read notebook json file
    async loadNotebook(url: string) {
        log.info('Load notebook')
        const jsonData = await File.read(url).catch((err) => {
            log.error(err)
        })
        // todo verify notebook json data
        // this.verify(jsonData)
        if (jsonData) {
            this.notebookJson = jsonData as INotebookJSON
        }
        return jsonData
    }

    // parse notebook json file
    async loadNotebookJSON(notebook: INotebookJSON) {
        log.info('Load notebook json')
        // todo verify notebook json data
        // this.verify(notebook)
        this.notebookJson = notebook as INotebookJSON
    }

    saveNotebook(notebook: INotebookViewModel) {
        File.write(notebook)
    }

    // prepare notebook
    async prepareNotebook(parameters: string[], clean = true) {
        log.info('prepare notebook json')
        if (!this.notebookJson) return
        if (clean) {
            this.cleanAllInjectedParameterCell(this.notebookJson)
        }
        if (this.hasParameters(parameters)) {
            const firstInjectedParameterCellIndex = this.findFirstInjectedParameterCellIndex(this.notebookJson)
            const firstParameterCellIndex = this.findFirstParameterCellIndex(this.notebookJson)
            this.handleParameters(
                firstParameterCellIndex,
                firstInjectedParameterCellIndex,
                this.notebookJson,
                parameters,
            )
        }
        log.warn(this.notebookJson)
    }

    // run notebook in silent mode
    async runNotebook(notebookCallback: INotebookCallback, silent = true) {
        log.info('Run notebook json')
        if (!this.notebookJson) return false
        if (!isNotebookRunning) return false
        // start
        const cells = this.notebookJson.cells
        const length = cells.length
        let finish = false
        const kernelInfo = this.getNotebookKernelInfo(cells)
        log.info('Notebook cell length: ', length)
        // running
        this.notebookStatus = NotebookStatus.RUNNING
        for (const [index, cell] of Object.entries(cells)) {
            // if (isParameterCell(cell)) {
            //     // parameter cell
            //     await this.backendManager.executeParameter(cell, kernelInfo)
            // } else if (isInjectedParameterCell(cell)) {
            //     // injected parameter cell
            //     await this.backendManager.executeParameter(cell, kernelInfo)
            // } else {
            // code cell
            await this.backendManager.execute(cell, (output: ICellOutput) => {
                if (silent) {
                    // ignore
                } else {
                    this.handleRunCellSuccess({ msg: output, cell })
                }
            })
            // }
            log.info(`Executing cell: ${Number(index) + 1} / ${length}`)
            notebookCallback({ current: Number(index), length, finish })
            // if interrupt
            if (this.interruptSignal) {
                break
            }
        }
        // finished
        finish = true
        this.interruptSignal = false
        this.notebookStatus = NotebookStatus.IDLE
        const _notebookJSON = cloneDeep(this.notebookJson)
        _notebookJSON.cells = cells
        notebookCallback({ current: length - 1, length, finish, notebookJSON: _notebookJSON })
        log.info(`Executing finished`)
        log.info(`Notebook cells: `, JSON.stringify(cells, null, 1))
        return true
    }

    // run notebook async
    async runNotebookAsync(silent: boolean) {
        const id = uuid()
        this.runNotebook((payload) => {
            if (payload.finish) {
                this.store[id] = payload.notebookJSON
            }
        }, silent)
        return id
    }

    // get async running notebook result
    getAsyncNotebookResult(id: string) {
        if (!this.store[id]) {
            return undefined
        }
        if (!isNotebookIdle(this.queryStatus())) {
            return undefined
        }
        return this.store[id]
    }

    // query status
    queryStatus() {
        return this.notebookStatus
    }

    // interrupt
    interrupt() {
        this.interruptSignal = true
    }
}
