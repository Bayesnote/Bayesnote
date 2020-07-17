import { ICell, INotebookViewModel } from '@bayesnote/common/lib/types.js'
import React from 'react'
import { store } from '../store'
import { exampleMultiLanguages, exampleVariableSharing } from '../utils/exampleNotebook'

export const Examples: React.FC = () => {

    const loadNotebook = (cells: ICell[]) => {
        let data: INotebookViewModel = {
            notebook: { cells: [] }
        }
        cells.forEach(cell => {
            //TODO: rename exportd
            data.notebook.cells.push({ cell: cell, exportd: '' })
        })
        console.log("loadExampleNotebook -> data", data)
        store.dispatch({ type: 'loadNotebook', payload: data })
    }

    return (
        <div className="mainToolbar" style={{
            padding: '10px', textAlign: 'right'
        }} >
            <div>
                < button onClick={() => loadNotebook(exampleMultiLanguages().cells)} > Example: Multiple Languages</button >
                < button onClick={() => loadNotebook(exampleVariableSharing().cells)} > Example: Variable Sharing</button >
            </div>
        </div >
    )
}


//TODO
/*
const getNotebookJSON = (): INotebookJSON => {
    let notebook = notebookVM.notebook
    let cellVMs = notebook.cells
    let cells = cellVMs.map(vm => vm.cell)
    let notebookJSON = {
        cells
    }
    return notebookJSON
}


const runNotebook = () => {
    let notebookJSON = getNotebookJSON()
    let parameters: string[] = []
    let clean = true // clean all injected-parameter cell
    client.emit('notebook.run', notebookJSON, parameters, clean)
}

const shutDownAllKernels = () => {
    client.emit('kernel.shutdown.all')
}

const clearAllOutputs = () => {
    store.dispatch({ type: 'clearAllOutputs' })
}

const ping = () => {
    client.emit('nb.ping')
}
*/