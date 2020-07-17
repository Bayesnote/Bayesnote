import { CellType, ICellViewModel, isParameterCell } from '@bayesnote/common/lib/types.js'
import React from 'react'
import client from '../socket'
import { store } from '../store'
import { getNotebookKernelInfo } from '../store/utils'
import Importexport from './import-export'
import { Input } from './input'
import Output from './output'

interface Props {
    cellVM: ICellViewModel
    // notebookVM: INotebookViewModel
    // kernels: IKernelSpecs
}

export const Cell: React.FC<Props> = ({ cellVM }) => {
    const notebookVM = store.getState().notebookReducer.notebookVM
    const kernels = store.getState().notebookReducer.kernels

    const shouldRenderOutput = () => {
        return Boolean(cellVM.cell.outputs.length) || cellVM.cell.type === CellType.MARKDOWN
    }

    const renderToolbar = () => {
        return <>
            {/* <div>
                <span>kernel: {kernels.find(kernel => kernel.name === cellVM.cell.kernelName)?.displayName}</span>
                <span> | </span>
                <span>state: {ICellState[cellVM.cell.state]}</span>
                <span> | </span>
                <span>id: <input type="text" style={{ width: '250px' }} defaultValue={cellVM.cell.id} /></span>
            </div> */}
            {/* <span> Type: </span> */}
            <select name="" id="" onChange={onChangeCellLanguage}>
                {kernels.map((kernel, index: number) => <option key={index} value={JSON.stringify({ kernelName: kernel.name, language: kernel.language, backend: kernel.backend })}>{kernel.displayName}</option>)}
            </select>
            {/* <span> run: </span>
            <button onClick={runCell}>run cell</button>
            <button onClick={interruptCell}>interrupt cell</button>
            <span> type: </span>
            <button onClick={onChangeCellType.bind(null, CellType.MARKDOWN)}>markdown</button>
            <button onClick={onChangeCellType.bind(null, CellType.CODE)}>code</button>
            <button onClick={onChangeCellType.bind(null, CellType.PARAMETER)}>parameter(py)</button>
            <span> output: </span>
            <button onClick={onClearCellOutput}>clear</button>
            <br /> */}
        </>
    }

    //onKeyDown={onKeyDown} onInputChange={onInputChange}
    const renderInput = () => {
        return <Input cellVM={cellVM} />
    }

    const onAddCell = () => {
        store.dispatch({ type: 'addCell' })
    }

    const onClearCellOutput = () => {
        store.dispatch({ type: 'clearCellOutput', payload: { cellVM } })
    }

    const onChangeCellType = (type: CellType) => {
        store.dispatch({ type: 'changeCellType', payload: { cellVM, type } })
    }

    const onChangeCellLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let languageWithBackend = JSON.parse(e.target.value)
        store.dispatch({ type: 'changeCellLanguage', payload: { cellVM, languageWithBackend } })
    }

    const onKeyDown = (ev: React.KeyboardEvent) => {
        if (ev.keyCode === 13 && ev.ctrlKey) {
            runCell()
        }
    }

    const interruptCell = () => {
        client.emit('cell.interrupt', cellVM.cell)
    }

    const runCell = () => {
        if (isParameterCell(cellVM.cell)) {
            let kernelInfo = getNotebookKernelInfo(notebookVM)
            client.emit('cell.run', cellVM.cell, kernelInfo)
        } else {
            client.emit('cell.run', cellVM.cell)
        }
    }

    const onInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>, cellVM: ICellViewModel) => {
        store.dispatch({ type: 'updateCellSource', payload: { cellVM, source: event.target.value } })
    }

    const renderBottomToolbar = () => {
        return (<>
            <div className="bottom-toolbar" style={{ textAlign: 'right' }}>
                <button onClick={runCell}>Run</button>
                <button onClick={onAddCell}>Add</button>
            </div>
        </>)
    }

    return (
        <>
            {renderToolbar()}
            <Importexport cellVM={cellVM} />
            <div className="cell-input">
                {renderInput()}
            </div>

            {shouldRenderOutput() ? <Output cellVM={cellVM} /> : null}

            {renderBottomToolbar()}
        </>
    )
}

// export default connect((state: IState) => ({ notebookVM: state.notebookVM, kernels: state.kernels }))(Cell)
