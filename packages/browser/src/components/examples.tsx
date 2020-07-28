import { ICell, INotebookViewModel } from '@bayesnote/common/lib/types.js'
import React from 'react'
import { useHistory } from "react-router"
import { store } from '../store'
import { preloadedState} from '../utils/dashboardState.json'
import { exampleChart, exampleMultiLanguages, exampleVariableSharing } from '../utils/exampleNotebook'

export const Examples: React.FC = () => {
    let history = useHistory()

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

    const loadDashboard = () => {
        const state = JSON.parse(preloadedState)
        const spec = state.chartListReducer.specs[0]
        const dashboard = state.dashboardListReducer.dashboards[0]
        const layouts = state.dashboardListReducer.layouts[0]
        const title = state.dashboardListReducer.titles[0]
        store.dispatch({ type: "saveChart", payload: { val: spec } })
        store.dispatch({ type: "saveDashboard", payload: { dashboard: dashboard, layouts: layouts, title: title } })
    }

    return (
        <div className="mainToolbar" style={{
            padding: '10px', textAlign: 'right'
        }} >
            <div >
                < button onClick={() => loadNotebook(exampleMultiLanguages().cells)} > Example: Multiple Languages</button >
                < button onClick={() => loadNotebook(exampleVariableSharing().cells)} > Example: Variable Sharing</button >
                < button onClick={() => loadNotebook(exampleChart().cells)} > Example: Chart</button >
                < button onClick={() => loadDashboard()} > Example: Dashboard</button >
                < button onClick={() => history.push("/workflow")} > Example: Notebook Flow</button >
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