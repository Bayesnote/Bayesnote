import { ICell, INotebookJSON, INotebookViewModel } from '@bayesnote/common/lib/types.js'
import React, { useState } from 'react'
import { connect } from 'react-redux'
import client from '../socket'
import { store } from '../store'
import { exampleCells, parameterExampleCells } from '../utils/exampleNotebook'

interface IState {
    notebookVM: INotebookViewModel
}

const MainToolbar: React.FC<IState> = ({ notebookVM }) => {
    const [notebookName, setNotebookName] = useState('unified-notebook')

    const loadNotebook = (cells: ICell[]) => {
        // let temp = {
        //     cells
        // }
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
    const loadExampleNotebook = () => {
        loadNotebook(exampleCells().cells)
    }

    const loadParameterExampleNotebook = () => {
        loadNotebook(parameterExampleCells().cells)
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
            {/* <span> load: </span> */}
            < button onClick={loadExampleNotebook} > Load Example Notebook</button >
            {/* <button onClick={loadParameterExampleNotebook}>parameter example notebook</button> */}
            {/* <br />
            <button onClick={runNotebook}>run notebook</button>
            <span> | </span>
            <input onChange={onChangeNotebookName} value={notebookName} type="text" />
            <a style={{ fontSize: '12px' }} download={`${notebookName}.json`} href={'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(getNotebookJSON(), null, 2))}>download notebook</a>
            <br />
            <button onClick={ping}>ping</button>
            <button onClick={shutDownAllKernels}>shutdown all kernels</button>
            <button onClick={clearAllOutputs}>clear all outputs</button> */}
        </div >
    )
}

const mapStateToProps = (state: IState) => ({ notebookVM: state.notebookVM })

export default connect(mapStateToProps)(MainToolbar)
