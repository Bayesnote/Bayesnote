import { runNotebook, runNotebookAsync, getAsyncJobResult, getStatus, interrupt } from './job'

export const swaggerDocument = () => {
    return {
        openapi: '3.0.1',
        info: {
            version: '0.0.1',
            title: 'APIs Document',
            description: 'Bayesnote REST API',
        },
        servers: [
            {
                url: `http://localhost:${process.env.EXPRESS_PORT}/api/v1`,
                description: 'The dev API server',
            },
        ],
        // job
        tags: [
            {
                name: 'job',
            },
            {
                name: 'job-async',
            },
        ],
        paths: {
            '/job': {
                post: runNotebook,
                get: getStatus,
                delete: interrupt,
            },
            '/job-async': {
                post: runNotebookAsync,
            },
            '/job-async/{id}': {
                get: getAsyncJobResult,
            },
        },
    }
}
