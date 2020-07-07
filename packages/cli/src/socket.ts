import { createLogger } from 'bunyan'
import { INotebookCallbackPayload } from '@bayesnote/common/lib/types'
import jsonFile from 'jsonfile'
import { resolve } from 'path'
import socket from 'socket.io-client'

const log = createLogger({ name: 'Socket' })

export class Socket {
    io: any
    startTime: number

    constructor(url: string = 'http://localhost') {
        this.io = socket(url)
        this.startTime = new Date().getTime()
        this.io.on('notebook.run.progress', this.onNotebookProgress.bind(this))
        this.io.on('notebook.run.ok', this.onRunNotebookOk.bind(this))
    }

    // handler
    private onNotebookProgress(payload: INotebookCallbackPayload) {
        log.info(`Current process ${payload.current + 1}/${payload.length}`)
    }

    private onRunNotebookOk(payload: INotebookCallbackPayload) {
        log.info('Running notebook finished')
        log.info('Total time', ((new Date().getTime() - this.startTime) / 1000).toFixed(3), 's')
        process.exit(process.exitCode)
    }

    private loadNotebookJSON = async (url: string) => {
        log.info('Loading notebook json file')
        return await jsonFile.readFile(resolve(process.cwd(), url))
    }

    // emit
    async runNotebook(path: string, parameters: string[], clean: boolean) {
        let notebook = await this.loadNotebookJSON(path)
        this.io.emit('notebook.run', notebook, parameters)
    }
}
