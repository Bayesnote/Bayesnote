import { ICellViewModel } from '@bayesnote/common/lib/types.js'
import React from 'react'
import { useSelector } from 'react-redux'
import client from '../socket'
import { store } from '../store'
import { RootState } from '../store/index'
import { Editor } from './monaco'
import Output from './output'

interface Props {
    cellVM: ICellViewModel
}

export const Cell: React.FC<Props> = ({ cellVM }) => {
    const notebookVM = useSelector((state: RootState) => state.notebookReducer.notebookVM)
    const kernels = useSelector((state: RootState) => state.notebookReducer.kernels)

    const onAddCell = () => {
        store.dispatch({ type: 'addCell' })
    }

    const onChangeCellLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let languageWithBackend = JSON.parse(e.target.value)
        store.dispatch({ type: 'changeCellLanguage', payload: { cellVM, languageWithBackend } })
    }

    //TODO
    const interruptCell = () => {
        client.emit('cell.interrupt', cellVM.cell)
    }

    const runCell = () => {
        client.emit('cell.run', cellVM.cell)
    }

    const renderLanguageSelection = () => {
        return <>
            <select name="" id="" onChange={onChangeCellLanguage}>
                {kernels.map((kernel, index: number) =>
                    <option key={index} value={JSON.stringify({ kernelName: kernel.name, language: kernel.language, backend: kernel.backend })}>{kernel.displayName}</option>)}
            </select>
        </>
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
            {renderLanguageSelection()}
            {<Editor cellVM={cellVM} />}
            {<Output cellVM={cellVM} />}
            {renderBottomToolbar()}
        </>
    )
}
