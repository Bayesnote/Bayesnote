import { ICodeCell, IExecuteResultOutput } from '@bayesnote/common/lib/types.js'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import client from '../socket'
import { store } from '../store'
import { RootState } from '../store/index'
import { Chart } from './chart'
import { Editor } from './monaco'
import Output from './output'

interface Props {
    cellVM: ICodeCell
}

export const Cell: React.FC<Props> = ({ cellVM }) => {
    const kernels = useSelector((state: RootState) => state.notebookReducer.kernels)
    const [renderChart, setRenderChart] = useState(false)

    const onAddCell = () => {
        store.dispatch({ type: 'addCell' })
    }

    const onAddChart = () => {
        //TODO: This is error-prone
        let data = (cellVM.outputs[0] as IExecuteResultOutput).data

        if (data['text/plain']) {
            const dataWithoutSingleQuote = data['text/plain'].substr(1, data['text/plain'].length - 2).replace(/'/g, "\\'")
            store.dispatch({ type: 'data', payload: { data: dataWithoutSingleQuote } })
        }
        setRenderChart(true)
    }

    const onChangeCellLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let languageWithBackend = JSON.parse(e.target.value)
        store.dispatch({ type: 'changeCellLanguage', payload: { cellVM, languageWithBackend } })
    }

    //TODO
    const interruptCell = () => {
        client.emit('cell.interrupt', cellVM)
    }

    const runCell = () => {
        client.emit('cell.run', cellVM)
    }

    const renderLanguageSelection = () => {

        return <>
            <select name="" id="" onChange={onChangeCellLanguage} value={JSON.stringify({ kernelName: cellVM.kernelName, language: cellVM.language, backend: cellVM.backend })}>
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
                <button onClick={onAddChart}>Chart</button>
            </div>
        </>)
    }

    return (
        <>
            {renderLanguageSelection()}
            {<Editor cellVM={cellVM} />}
            {renderBottomToolbar()}
            {<Output cellVM={cellVM} />}
            {<Chart renderChart={renderChart} />}
        </>
    )
}
