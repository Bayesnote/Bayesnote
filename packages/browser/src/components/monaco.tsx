import { ICellViewModel } from '@bayesnote/common/lib/types.js';
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import React, { useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
//import MonacoEditor from '../../node_modules/react-monaco-editor/src/index';
import { store } from '../store';

//TODO: Add code completion
//TODO: Check javascript highlight
interface Props {
    cellVM: ICellViewModel
}

export const Editor: React.FC<Props> = ({ cellVM }) => {

    const options = {
        minimap: { enabled: false },
        // scrollbar: { vertical: 'hidden' },
    }

    const [height, setHeight] = useState(0)
    const [code, setCode] = useState(cellVM.cell.source)
    let model: monaco.editor.ITextModel | null

    const editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        editor.focus();
        model = editor.getModel()
        if (model) {
            setHeight((model.getLineCount() + 1) * 19)
        }
    }

    //TODO: type
    const onChange = (newValue: string) => {
        if (model) {
            const contentHeight = (model.getLineCount() + 1) * 19
            setHeight((model.getLineCount() + 1) * 19)
            setCode(newValue)
        }
        store.dispatch({ type: 'updateCellSource', payload: { cellVM: cellVM, source: newValue } })
    }

    return (
        <MonacoEditor
            ref="monaco"
            height={height}
            theme="vs-dark"
            language={cellVM.cell.language}
            value={code}
            options={options}
            onChange={onChange}
            editorDidMount={editorDidMount}
        />
    );
}
