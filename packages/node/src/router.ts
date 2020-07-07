import express, { Request, Response } from 'express'
// import { createLogger } from 'bunyan'
import { INotebookJSON, INotebookCallbackPayload, NotebookStatus, isNotebookIdle } from '@bayesnote/common/lib/types'
import { INotebookManager, NotebookManager } from './notebook'

// const log = createLogger({ name: 'Notebook router' })
const PREFIX = '/api/v1'

// sync run job with or without outputs
const runSync = (notebookManager: INotebookManager, silent = true, clean = true) => {
    return async (req: Request, res: Response) => {
        const { notebook, parameters } = req.body // todo verify notebook json
        await notebookManager.loadNotebookJSON(notebook)
        if (parameters && parameters.length) {
            await notebookManager.prepareNotebook(parameters, clean)
        }
        let _notebookJSON
        const finish = await notebookManager.runNotebook((payload) => {
            if (payload.finish) {
                _notebookJSON = payload.notebookJSON
            }
        }, silent)
        res.json({ data: _notebookJSON, msg: '' })
    }
}

// async run job with or without outputs
const runAsync = (notebookManager: INotebookManager, silent = true, clean = true) => {
    return async (req: Request, res: Response) => {
        const { notebook, parameters } = req.body // todo verify notebook json
        await notebookManager.loadNotebookJSON(notebook)
        if (parameters && parameters.length) {
            await notebookManager.prepareNotebook(parameters, clean)
        }
        const id = await notebookManager.runNotebookAsync(silent)
        res.json({ data: id, msg: '' })
    }
}

const getAsyncNotebookResult = (notebookManager: INotebookManager) => {
    return (req: Request, res: Response) => {
        const id = req.params.id
        if (!id) {
            res.json({ data: null, msg: 'Please pass id param' })
        }
        const result: INotebookJSON | undefined = notebookManager.getAsyncNotebookResult(id)
        if (result) {
            res.json({ data: result, msg: '' })
        } else {
            res.json({ data: null, msg: 'Did not get notebookJSON.' })
        }
    }
}

// get job status
const getStatus = (notebookManager: INotebookManager) => {
    return (req: Request, res: Response) => {
        const statusCode = notebookManager.queryStatus()
        const statusName = NotebookStatus[statusCode]
        res.json({ data: { statusCode, statusName }, msg: '' })
    }
}

// interrupt
const interrupt = (notebookManager: INotebookManager) => {
    return (req: Request, res: Response) => {
        const status = notebookManager.queryStatus()
        if (isNotebookIdle(status)) {
            res.json({ data: 'ok', msg: 'Runner is now idel.' })
        } else {
            notebookManager.interrupt()
            res.json({ data: 'ok', msg: 'Will be interrupted after current cell executed.' })
        }
    }
}

export const createRouter = () => {
    return (notebookManager: INotebookManager) => {
        const router = express.Router()
        // * notebook job routers
        router.post(`${PREFIX}/job`, runSync(notebookManager, false))
        router.post(`${PREFIX}/job-async`, runAsync(notebookManager, false))
        router.get(`${PREFIX}/job-async/:id`, getAsyncNotebookResult(notebookManager))
        router.get(`${PREFIX}/job`, getStatus(notebookManager))
        router.delete(`${PREFIX}/job`, interrupt(notebookManager))
        return router
    }
}
