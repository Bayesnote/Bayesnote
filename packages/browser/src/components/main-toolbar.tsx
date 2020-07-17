import { ICell, INotebookJSON, INotebookViewModel } from '@bayesnote/common/lib/types.js'
import React, { useState } from 'react'
import client from '../socket'
import { store } from '../store'
import { exampleMultiLanguages, exampleVariableSharing, exampleWorkflow, parameterExampleCells } from '../utils/exampleNotebook'

// interface IState {
//     notebookVM: INotebookViewModel
// }

export const Examples: React.FC = () => {
    const notebookVM = store.getState().notebookReducer.notebookVM
    const [notebookName, setNotebookName] = useState('unified-notebook')

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

    // * example notebook data
    const loadMultiLangExample = () => {
        loadNotebook(exampleMultiLanguages().cells)
    }

    const loadVariableSharingExample = () => {
        loadNotebook(exampleVariableSharing().cells)
    }

    const loadParameterExampleNotebook = () => {
        loadNotebook(parameterExampleCells().cells)
    }

    //TODO:
    const loadWorkflowExample = () => {
        loadNotebook(exampleWorkflow().cells)
    }

    const getNotebookJSON = (): INotebookJSON => {
        let notebook = notebookVM.notebook
        let cellVMs = notebook.cells
        let cells = cellVMs.map(vm => vm.cell)
        let notebookJSON = {
            cells
        }
        return notebookJSON
    }

    const onChangeNotebookName = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value
        setNotebookName(val)
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

    return (
        <div className="mainToolbar" style={{
            padding: '10px', textAlign: 'right'
        }} >
            <div>
                < button onClick={loadMultiLangExample} > Example: Multiple Languages</button >
                < button onClick={loadVariableSharingExample} > Example: Variable Sharing</button >
                < button onClick={loadWorkflowExample} > Example: Workflow</button >
            </div>
        </div >
    )
}

// const mapStateToProps = (state: IState) => ({ notebookVM: state.notebookVM })

// export default connect(mapStateToProps)(Examples)
