import { CellType, ICellViewModel } from '@bayesnote/common/lib/types.js';
import React from 'react';
import { Editor } from './monaco.js';

interface Props {
    cellVM: ICellViewModel
    onInputChange(event: React.ChangeEvent<HTMLTextAreaElement>, cellVM: ICellViewModel): void
    onKeyDown(ev: React.KeyboardEvent): void
}

export const Input: React.FC<Props> = ({ cellVM, onInputChange, onKeyDown }) => {

    const renderMarkdownInput = () => {
        return <textarea
            style={{ width: '100%', minHeight: "90px", backgroundColor: "#404040" }}
            value={cellVM.cell.source}
            placeholder="markdown"
            onKeyDown={onKeyDown}
            onChange={(event) => onInputChange(event, cellVM)} ></textarea>
    }

    const renderCodeInput = () => {
        return  <Editor />
        // <textarea
        //     style={{ width: '100%', minHeight: "90px", backgroundColor: "#404040" }}
        //     value={cellVM.cell.source}
        //     // placeholder="code"
        //     onKeyDown={onKeyDown}
        //     onChange={(event) => onInputChange(event, cellVM)} ></textarea>

    }

    const renderParameterInput = () => {
        return <textarea
            style={{ width: '100%', minHeight: "90px", backgroundColor: "#404040" }}
            value={cellVM.cell.source}
            placeholder="parameter(py)"
            onKeyDown={onKeyDown}
            onChange={(event) => onInputChange(event, cellVM)} ></textarea>
    }

    const render = () => {
        let type = cellVM.cell.type
        if (type === CellType.MARKDOWN) {
            return renderMarkdownInput()
        } else if (type === CellType.PARAMETER) {
            return renderParameterInput()
        } else {
            return renderCodeInput()
        }
    }

    return (
        <>
            {render()}
        </>
    )
}
