import {
    ICellOutput,
    ICodeCell,
    IExecuteResultOutput,
    IKernelInfo,
    INotebook,
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
import { createLogger } from 'bunyan'
import jsonfile, { Path } from 'jsonfile'
import cloneDeep from 'lodash/cloneDeep'
import uniqBy from 'lodash/uniqBy'
import path from 'path'
import { BackendManager } from './backend'

const log = createLogger({ name: 'NotebookManager' })

namespace File {
    //TODO: This is ugly
    export const read = (url: string): Promise<INotebook> => {
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

    export const write = (notebookVM: INotebook) => {
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
    notebook: INotebook | undefined
    loadNotebook(url: string): Promise<INotebook | void>
    loadNotebookJSON(notebook: INotebook): Promise<void>
    saveNotebook(notebook: INotebook): void
    // prepareNotebook(parameters: string[], clean: boolean): Promise<void>
    runNotebook(silent: boolean): Promise<boolean>
    // runNotebookAsync(silent: boolean): Promise<string>
    getAsyncNotebookResult(id: string): INotebook | undefined
    queryStatus(): NotebookStatus
    interrupt(): void
}

interface IStore {
    [key: string]: INotebook | undefined
}

export class NotebookManager implements INotebookManager {
    notebook: INotebook | undefined
    parameters: string[] = []
    backendManager: BackendManager
    notebookStatus: NotebookStatus = NotebookStatus.IDLE
    interruptSignal = false
    store: IStore = {}

    constructor(backendManager: BackendManager) {
        this.backendManager = backendManager
    }

    private handleRunCellSuccess(res: IResponse) {
        const msg: ICellOutput = res.msg
        const cell: ICodeCell = res.cell
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

    private handleExecuteResult(msg: IExecuteResultOutput, cell: ICodeCell) {
        cell.outputs = [msg]
    }

    private handleStreamOutput(msg: IStreamOutput, cell: ICodeCell) {
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

    // read notebook json file
    async loadNotebook(url: string) {
        log.info('Load notebook')
        const jsonData = await File.read(url).catch((err) => {
            log.error(err)
        })
        // todo verify notebook json data
        // this.verify(jsonData)
        if (jsonData) {
            this.notebook = jsonData as INotebook
        }
        return jsonData
    }

    // parse notebook json file
    async loadNotebookJSON(notebook: INotebook) {
        log.info('Load notebook json')
        // todo verify notebook json data
        // this.verify(notebook)
        this.notebook = notebook as INotebook
    }

    saveNotebook(notebook: INotebook) {
        File.write(notebook)
    }

    // run notebook in silent mode
    async runNotebook(silent = true) {
        log.info('Run notebook json')
        if (!this.notebook) return false
        if (!isNotebookRunning) return false
        // start
        const cells = this.notebook.cells
        //TODO: UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'length' of null
        const length = cells.length
        let finish = false
        const kernelInfo = this.getNotebookKernelInfo(cells)
        log.info('Notebook cell length: ', length)
        // running
        this.notebookStatus = NotebookStatus.RUNNING
        for (const [index, cell] of Object.entries(cells)) {
            await this.backendManager.execute(cell, (output: ICellOutput) => {
                if (silent) {
                    // ignore
                } else {
                    this.handleRunCellSuccess({ msg: output, cell })
                }
            })
            // }
            log.info(`Executing cell: ${Number(index) + 1} / ${length}`)
            // notebookCallback({ current: Number(index), length, finish })
            // if interrupt
            if (this.interruptSignal) {
                break
            }
        }
        // finished
        finish = true
        this.interruptSignal = false
        this.notebookStatus = NotebookStatus.IDLE
        const _notebookJSON = cloneDeep(this.notebook)
        _notebookJSON.cells = cells
        // notebookCallback({ current: length - 1, length, finish, notebookJSON: _notebookJSON })
        log.info(`Executing finished`)
        log.info(`Notebook cells: `, JSON.stringify(cells, null, 1))
        return true
    }

    // run notebook async
    // async runNotebookAsync(silent: boolean) {
    //     const id = uuid()
    //     this.runNotebook((payload: any) => {
    //         if (payload.finish) {
    //             this.store[id] = payload.notebookJSON
    //         }
    //     }, silent)
    //     return id
    // }

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
