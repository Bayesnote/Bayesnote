import { CellType, ICellViewModel, IexportdVarMap, IexportdVarMapValue, IExportVarPayload } from '@bayesnote/common/lib/types'
import React, { useState } from 'react'
import { connect } from 'react-redux'
import client from '../socket'
import { IState } from '../store/reducer'

interface Props {
    cellVM: ICellViewModel
    exportdVarMap: IexportdVarMap
}

const createexportVarPayload = (exportVar: string, cellVM: ICellViewModel): IExportVarPayload => {
    return {
        exportVar: exportVar,
        exportCell: cellVM.cell
    }
}

const RenderImportexportdVar: React.FC<Props> = ({ cellVM, exportdVarMap }) => {
    const [exportVar, setexportVar] = useState('')
    const [selectedImportVar, setSelectedImportVar] = useState(JSON.stringify({}))
    const [variableRename, setVariableRename] = useState('temp_var')

    const onexportSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            if (cellVM.cell.type !== CellType.CODE) return
            let exportVarPayload: IExportVarPayload = createexportVarPayload(exportVar, cellVM)
            client.emit('export.variable', exportVarPayload)
        }
    }

    const onexportVar = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value
        setexportVar(val)
    }

    const onImportSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        let exportdVarMapValue = (JSON.parse(selectedImportVar) as IexportdVarMapValue)
        if (e.keyCode === 13) {
            if (cellVM.cell.type !== CellType.CODE) return
            if (!selectedImportVar) return
            if (exportdVarMapValue.id === cellVM.cell.id) return
            if (!exportdVarMapValue.id || !exportdVarMapValue.payload.exportVar) return
            exportdVarMapValue.payload.importVarRename = variableRename
            exportdVarMapValue.payload.importCell = cellVM.cell
            console.log("onImportSubmit -> exportdVarMapValue", exportdVarMapValue)
            client.emit('export.variable.import', exportdVarMapValue)
        }
    }

    const getexportdVarMapValueList = (): IexportdVarMapValue[] => {
        let exportdMapValueList = []
        for (const val of Object.values(exportdVarMap)) {
            exportdMapValueList.push(val)
        }
        return exportdMapValueList
    }

    const shouldDisableImport = () => {
        // import exported var from any cell
        let flag = false
        let exportdVarMapValueList = getexportdVarMapValueList()
        if (!exportdVarMapValueList.length) flag = true
        return flag
    }

    const renderexport = () => {
        return (<>
            {/* export */}
            {/* <span> export var: </span> */}
            <input type="text" value={exportVar} placeholder="Export variable" onKeyDown={(e) => { onexportSubmit(e) }} onChange={(e) => { onexportVar(e) }} />
            {/* <span> exported var:  </span>
                {cellVM.exportd} */}
        </>)
    }

    const renderImport = () => {
        let disabled = shouldDisableImport()
        return (<>
            {/* import */}
            {/* <span>import var: </span> */}
            <select disabled={disabled} value={selectedImportVar} onChange={(e) => { setSelectedImportVar(e.target.value) }}>
                <option key="-1" label="Import variable" value={JSON.stringify({ id: '', payload: {} })}></option>
                {getexportdVarMapValueList().map((item, index) => (
                    <option key={index} label={`${item.payload.exportVar}-${item.id}`} value={JSON.stringify(item)}></option>
                ))}
            </select>
            {/* <span> as </span>
                <input disabled={disabled} type="text" value={variableRename} onChange={(e) => { setVariableRename(e.target.value) }} placeholder="Rename variable" onKeyDown={(e) => { onImportSubmit(e) }} /> */}
        </>)
    }

    return ((<>
        <div className="IO-variable" style={{ textAlign: 'right' }} >
            {renderexport()}
            {renderImport()}
        </div>
    </>))
}

export default connect((state: IState) => ({ exportdVarMap: state.exportdVarMap }))(RenderImportexportdVar)
