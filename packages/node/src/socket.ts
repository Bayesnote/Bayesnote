import {
    ICodeCell,
    IexportdVarMap,
    IexportdVarMapValue,
    IexportVarOutput,
    IExportVarPayload,
    IKernelInfo,
    INotebook,
} from '@bayesnote/common/lib/types'
import { createLogger } from 'bunyan'
import { createServer } from 'http'
import type { Server } from 'http'
import socketIO from 'socket.io'
import { BackendManager } from './backend'
import { NotebookManager } from './notebook'

const log = createLogger({ name: 'Socket' })

export class SocketManager {
    server: Server | undefined
    io: socketIO.Server | undefined
    socket: socketIO.Socket | undefined
    backendManager: BackendManager
    notebookManager: NotebookManager
    // todo exported var map manager
    exportdVarMap: IexportdVarMap = {}

    constructor(
        app: Express.Application,
        port: number,
        backendManager: BackendManager,
        notebookManager: NotebookManager,
    ) {
        this.server = createServer(app)
        this.io = socketIO.listen(this.server)
        this.server.listen(port)
        this.io.on('connection', this._onConnection.bind(this))
        this.backendManager = backendManager
        this.notebookManager = notebookManager
    }

    private _onConnection(socket: socketIO.Socket) {
        log.info('socket connected')
        this.socket = socket
        // bind handler
        log.info('socket connection success')
        socket.emit('socketID', socket.client.id)
        socket.on('nb.ping', this.onPing(socket))
        socket.on('kernel.list', this.onKernelList(socket))
        socket.on('kernel.shutdown.all', this.onKernelShutDownAll(socket))
        socket.on('kernel.running.list', this.onKernelRunningList(socket))
        // run code
        socket.on('cell.run', this.onCellRun(socket))
        socket.on('cell.interrupt', this.onCellInterrupt(socket))
        // run notebook
        // socket.on('notebook.run', this.onNotebookRun(socket))
        // export
        socket.on('export.variable', this.onexportVariable(socket))
        socket.on('export.variable.list', this.onexportVariableList(socket))
        socket.on('export.variable.import', this.onexportVariableImport(socket))
        socket.on('notebook.save', this.onNotebookSave(socket))
    }

    // exported var map
    private updateexportMap = (store: IexportdVarMapValue): void => {
        this.exportdVarMap[store.id] = store
    }

    private getexportdVarMapValueWithOutJsonData = (exportdVarMapValue: IexportdVarMapValue): IexportdVarMapValue => {
        const { id, payload } = exportdVarMapValue
        return { id, payload }
    }

    private createexportdVarMapValue(
        exportVarOutput: IexportVarOutput,
        exportVarPayload: IExportVarPayload,
    ): IexportdVarMapValue {
        const store: IexportdVarMapValue = {
            id: exportVarPayload.exportCell.id,
            payload: exportVarPayload,
            jsonData: exportVarOutput,
        }
        this.updateexportMap(store)
        return store
    }

    // socket handler
    private onPing = (socket: SocketIO.Socket) => {
        return () => {
            socket.emit('nb.pong')
        }
    }

    private onKernelList = (socket: SocketIO.Socket) => {
        return async () => {
            const kernels = await this.backendManager.kernels()
            socket.emit('kernel.list.ok', kernels)
        }
    }

    private onKernelShutDownAll = (socket: SocketIO.Socket) => {
        return async () => {
            this.backendManager.getBackend('Jupyter').shutdownAllKernel()
        }
    }

    private onKernelRunningList = (socket: SocketIO.Socket) => {
        return async () => {
            const kernels = await this.backendManager.getBackend('Jupyter').runningKernels()
            socket.emit('kernel.running.list.ok', kernels)
        }
    }

    private onCellRun = (socket: SocketIO.Socket) => {
        return async (cell: ICodeCell, kernelInfo?: IKernelInfo) => {
            try {
                await this.backendManager.execute(cell, (msg) => {
                    socket.emit('cell.run.ok', { msg, cell })
                })
            } catch (error) {
                log.error(error)
            }
        }
    }

    private onCellInterrupt = (socket: SocketIO.Socket) => {
        return async (cell: ICodeCell) => {
            try {
                await this.backendManager.interrupt(cell)
            } catch (error) {
                log.error(error)
            }
        }
    }

    // private onNotebookRun = (socket: SocketIO.Socket) => {
    //     return async (notebook: INotebook, clean = true) => {
    //         try {
    //             await this.notebookManager.loadNotebookJSON(notebook)
    //             //TODO: Fix this
    //             // await this.notebookManager.runNotebook((payload: INotebookCallbackPayload) => {
    //             //     if (payload.finish) {
    //             //         socket.emit('notebook.run.ok', payload)
    //             //     } else {
    //             //         socket.emit('notebook.run.progress', payload)
    //             //     }
    //             // }, false)
    //         } catch (error) {
    //             log.error(error)
    //         }
    //     }
    // }

    private onNotebookSave = (socket: SocketIO.Socket) => {
        return (notebook: INotebook) => {
            this.notebookManager.saveNotebook(notebook)
        }
    }

    private onexportVariable = (socket: SocketIO.Socket) => {
        return async (exportVarPayload: IExportVarPayload) => {
            try {
                const exportVarOutput = await this.backendManager.exportVar(exportVarPayload)
                //TODO: This naming is a joke
                const exportdVarMapValue = this.getexportdVarMapValueWithOutJsonData(
                    this.createexportdVarMapValue(exportVarOutput, exportVarPayload),
                )
                socket.emit('export.variable.ok', exportdVarMapValue)
            } catch (error) {
                log.error(error)
            }
        }
    }

    private onexportVariableList = (socket: SocketIO.Socket) => {
        return async () => {
            const _exportdVarMap: IexportdVarMap = {}
            for (const [id, val] of Object.entries(this.exportdVarMap)) {
                _exportdVarMap[id] = this.getexportdVarMapValueWithOutJsonData(val)
            }
            socket.emit('export.variable.list.ok', _exportdVarMap)
        }
    }

    private onexportVariableImport = (socket: SocketIO.Socket) => {
        return async (exportdVarMapValue: IexportdVarMapValue) => {
            try {
                log.info('import variable exportdVarMapValue')
                const _exportdVarMapValue: IexportdVarMapValue = this.exportdVarMap[
                    exportdVarMapValue.payload.exportCell.id
                ]
                // merge payload
                _exportdVarMapValue.payload.importCell = exportdVarMapValue.payload.importCell
                _exportdVarMapValue.payload.importVarRename = exportdVarMapValue.payload.importVarRename
                const bool = await this.backendManager.importVar(_exportdVarMapValue)
                log.info('import variable finish: ', bool)
                socket.emit('export.variable.import.ok', bool)
            } catch (error) {
                log.error(error)
            }
        }
    }
}
