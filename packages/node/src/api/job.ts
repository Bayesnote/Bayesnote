export const runNotebook = {
    tags: ['job'],
    description: 'Read notebook JSON data and run notebook with parameters.',
    requestBody: {
        description: 'NotebookJSON and Parameters',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        notebook: {
                            type: 'object',
                            required: true,
                            description: 'Notebook JSON Object <INotebookJSON>.',
                        },
                        parameters: {
                            type: 'array',
                            items: {
                                type: 'string',
                                required: false,
                                description: 'Javascript code <string>.',
                            },
                        },
                    },
                },
                example: {
                    notebook: {
                        cells: [
                            {
                                id: '4e698ede-c098-4d84-bbce-516d448c4f97',
                                type: 'code',
                                source: '#result example\n\n1 + 1',
                                language: 'python',
                                kernelName: 'python3',
                                backend: 'Jupyter',
                                metadata: { scrollbar: false, source_hidden: false, output_hidden: false },
                                outputs: [],
                                state: 2,
                            },
                        ],
                    },
                },
            },
        },
    },
    responses: {
        '200': {
            description: 'Return notebook JSON with outputs.',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                description: 'Notebook JSON <INotebookJSON>.',
                            },
                            msg: {
                                type: 'string',
                                description: 'Messages <string>.',
                            },
                        },
                    },
                },
            },
        },
    },
}

export const runNotebookAsync = {
    tags: ['job-async'],
    description: 'Read notebook JSON data and run notebook with parameters asynchronously. It will return job id.',
    requestBody: {
        description: 'NotebookJSON and Parameters',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        notebook: {
                            type: 'object',
                            required: true,
                            description: 'Notebook JSON Object <INotebookJSON>.',
                        },
                        parameters: {
                            type: 'array',
                            items: {
                                type: 'string',
                                required: false,
                                description: 'Javascript code <string>.',
                            },
                        },
                    },
                },
                example: {
                    notebook: {
                        cells: [
                            {
                                id: '4e698ede-c098-4d84-bbce-516d448c4f97',
                                type: 'code',
                                source: "from time import sleep\n\nsleep(20)\nprint('done')\n",
                                language: 'python',
                                kernelName: 'python3',
                                backend: 'Jupyter',
                                metadata: { scrollbar: false, source_hidden: false, output_hidden: false },
                                outputs: [],
                                state: 2,
                            },
                        ],
                    },
                },
            },
        },
    },
    responses: {
        '200': {
            description: 'Return job id.',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'string',
                                description: 'Job id.',
                            },
                            msg: {
                                type: 'string',
                                description: 'Messages <string>.',
                            },
                        },
                    },
                },
            },
        },
    },
}

export const getAsyncJobResult = {
    tags: ['job-async'],
    description: 'Get async job result by id.',
    parameters: [
        {
            name: 'id',
            in: 'path',
            description: 'ID of job',
            required: true,
            schema: {
                type: 'string',
            },
        },
    ],
    responses: {
        '200': {
            description:
                'Return notebook JSON with outputs. It will return Null when not match id or currently running.',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                description: 'Notebook JSON <INotebookJSON | null>',
                            },
                            msg: {
                                type: 'string',
                                description: 'Messages <string>.',
                            },
                        },
                    },
                },
            },
        },
    },
}

export const getStatus = {
    tags: ['job'],
    description: 'Get runner status - RUNNIG or IDEL',
    responses: {
        '200': {
            description: 'Return status code and name',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                description: 'Status code and name',
                                properties: {
                                    statusCode: { type: 'integer' },
                                    statusName: { type: 'string' },
                                },
                            },
                            msg: {
                                type: 'string',
                                description: 'Messages <string>.',
                            },
                        },
                    },
                },
            },
        },
    },
}

export const interrupt = {
    tags: ['job'],
    description: 'Interrupt runner - it will stop after current cell executed.',
    responses: {
        '200': {
            description: 'Return interrupted msg',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'string',
                                description: 'Ok confirm',
                            },
                            msg: {
                                type: 'string',
                                description: 'Messages <string>.',
                            },
                        },
                    },
                },
            },
        },
    },
}
