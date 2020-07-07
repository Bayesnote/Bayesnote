import { createLogger } from 'bunyan'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import swaggerUI from 'swagger-ui-express'
import { swaggerDocument } from './api/swagger'
import { BackendManager } from './backend'
import { JupyterKernel } from './kernel/jupyter'
import { NotebookManager } from './notebook'
import { createRouter } from './router'
import { SocketManager } from './socket'

const log = createLogger({ name: 'Main' })

dotenv.config()

const main = async () => {
    const app = express()
    const port = process.env.EXPRESS_PORT

    // init zeppelin and jupyter
    const backendManager = new BackendManager()
    backendManager.register(await new JupyterKernel().init())
    // backendManager.register(await new ZeppelinKernel().init())

    // init notebook runner
    const notebookManager = new NotebookManager(backendManager)

    // socketIO
    const socketManager = new SocketManager(app, 8890, backendManager, notebookManager)

    // express middleware
    app.use(cors())
    app.use(express.json())
    app.use(createRouter()(notebookManager))
    app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument()))
    app.listen(port, () => {
        log.info(`API: http://localhost:${port}`)
    })
}
main()
