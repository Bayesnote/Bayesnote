// import { createLogger } from 'bunyan'
import { isNotebookIdle, NotebookStatus } from '@bayesnote/common/lib/types'
import { createLogger } from 'bunyan'
import express, { Request, Response } from 'express'
import { NotebookManager } from './notebook'

const log = createLogger({ name: 'Notebook router' })
const PREFIX = '/api/v1'

// sync run job with or without outputs
//TODO: This is duplicate with socket.io
const run = (notebookManager: NotebookManager, silent = true, clean = true) => {
    return async (req: Request, res: Response) => {
        const { cells } = req.body
        log.info(cells)
        await notebookManager.loadNotebookJSON(cells)
        const { success, output } = await notebookManager.runNotebook()
        res.json({ cells: output, success: success })
    }
}

// get job status
const getStatus = (notebookManager: NotebookManager) => {
    return (req: Request, res: Response) => {
        const statusCode = notebookManager.queryStatus()
        const statusName = NotebookStatus[statusCode]
        res.json({ data: { statusCode, statusName }, msg: '' })
    }
}

// interrupt
const interrupt = (notebookManager: NotebookManager) => {
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

const ping = () => {
    return (req: Request, res: Response) => {
        res.status(200).json(null)
    }
}

export const createRouter = () => {
    return (notebookManager: NotebookManager) => {
        const router = express.Router()
        // ping
        router.get(`${PREFIX}/ping`, ping())
        // notebook
        router.post(`${PREFIX}/job`, run(notebookManager, false))
        router.get(`${PREFIX}/job`, getStatus(notebookManager))
        router.delete(`${PREFIX}/job`, interrupt(notebookManager))
        return router
    }
}
