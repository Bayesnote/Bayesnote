import {
    ICodeCell,
    IexportdVarMapValue,
    IexportVarOutput,
    IExportVarPayload,
    IKernelInfo,
    IKernelSpecs,
} from '@bayesnote/common/lib/types'
import { createEmptyCodeCell } from '@bayesnote/common/lib/utils'
import { createLogger } from 'bunyan'
import { IKernelBase, ResultsCallback } from './kernel/kernel'
import { IJsonDataMap, Translator } from './translator'

const log = createLogger({ name: 'BackendManager' })

//TODO: REFACTOR backend.ts/notebook.ts/socket.ts, especially handleResult()
type ITranslatedMap = {
    [key: string]: {
        code: string
        backend: string
        language: string
    }
}

interface IBackendManager {
    kernels(): Promise<IKernelSpecs>
    register(kernel: IKernelBase): void
    getBackend(name: string): IKernelBase
    execute(cell: ICodeCell, onResults: ResultsCallback): void
    // executeParameter(cell: ICodeCell, kernelInfo: IKernelInfo): Promise<boolean>
    interrupt(cell: ICodeCell): void
    exportVar(payload: IExportVarPayload): Promise<IexportVarOutput>
    importVar(payload: IexportdVarMapValue): Promise<boolean>
}

export class BackendManager implements IBackendManager {
    backends: { [key: string]: IKernelBase } = {}
    translator: Translator

    constructor() {
        this.translator = new Translator()
    }

    async kernels(): Promise<IKernelSpecs> {
        let kernelList: IKernelSpecs = []
        for await (const [key, backend] of Object.entries(this.backends)) {
            const kernels = await backend.kernels()
            kernelList = [...kernelList, ...kernels]
        }
        return Array.from(new Set(kernelList))
    }

    register(kernel: IKernelBase) {
        this.backends[kernel.name] = kernel
    }

    getBackend(name: string) {
        return this.backends[name]
    }

    private prepareParameterCells(cell: ICodeCell, kernelInfo: IKernelInfo) {
        log.info('Prepare translateMap')
        const jsonDataMap: IJsonDataMap = this.translator.toJSONDataMap(cell)
        const translatedMap: ITranslatedMap = {}
        // Prepare each language import JSON script
        for (const info of Object.values(kernelInfo)) {
            let code = ''
            for (const [valName, jsonStr] of Object.entries(jsonDataMap)) {
                code += this.translator.translateFromJSONImportCode(info.language, info.kernelName, jsonStr, valName)
            }
            translatedMap[info.language] = {
                code,
                backend: info.backend,
                language: info.language,
            }
        }
        // prepare cells
        const cells = []
        for (const translated of Object.values(translatedMap)) {
            const _cell = createEmptyCodeCell()
            _cell.backend = translated.backend
            _cell.language = translated.language
            _cell.source = translated.code
            cells.push(_cell)
        }
        return cells
    }

    // execute
    async execute(cell: ICodeCell, onResults: ResultsCallback) {
        const backend = this.getBackend(cell.backend)
        const finished = await backend.execute(cell, onResults)
        return finished
    }

    // execute parameter
    async executeParameter(cell: ICodeCell, kernelInfo: IKernelInfo): Promise<boolean> {
        log.info('Execute parameter')
        // * Only support javascript to python parameter cell currently
        // * Get all backends and call executeParameter function
        // * run cell in every running kernel
        const cells = this.prepareParameterCells(cell, kernelInfo)
        // execute
        const promises = []
        for (const _cell of Object.values(cells)) {
            promises.push(
                await this.execute(_cell, (res) => {
                    console.log(res)
                }),
            )
        }
        const res = await Promise.all(promises)
        return res.every(Boolean)
    }

    // interrupt
    async interrupt(cell: ICodeCell) {
        const backend = this.getBackend(cell.backend)
        await backend.interrupt(cell)
    }

    // export variable
    async exportVar(exportVarPayload: IExportVarPayload) {
        return await this.getBackend(exportVarPayload.exportCell.backend).exportVar(exportVarPayload)
    }

    // import variable
    async importVar(exportdMapValue: IexportdVarMapValue) {
        const importCell = exportdMapValue.payload.importCell
        if (!importCell) return false
        return await this.getBackend(importCell.backend).importVar(exportdMapValue)
    }
}
