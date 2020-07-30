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

interface IStore {
    [key: string]: INotebook | undefined
}

export class NotebookManager {
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
            log.info('handleRunCellSuccess')
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

    //TODO: verify JSON
    async loadNotebookJSON(notebook: INotebook) {
        log.info('Load notebook')
        this.notebook = notebook as INotebook
    }

    saveNotebook(notebook: INotebook) {
        File.write(notebook)
    }

    //TODO: fix return type
    async runNotebook(): Promise<any> {
        log.info('Run notebook')
        if (!this.notebook) return { success: false }
        if (!isNotebookRunning) return { success: false }

        // running
        this.notebookStatus = NotebookStatus.RUNNING
        for (const [index, cell] of Object.entries(this.notebook)) {
            await this.backendManager.execute(cell, (output: ICellOutput) => {
                this.handleRunCellSuccess({ msg: output, cell })
            })

            if (this.interruptSignal) {
                break
            }
        }

        // finished
        this.notebookStatus = NotebookStatus.IDLE

        return { success: true, output: cloneDeep(this.notebook) }
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
