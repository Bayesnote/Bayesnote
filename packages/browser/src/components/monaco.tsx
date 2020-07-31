import { ICodeCell } from '@bayesnote/common/lib/types.js';
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import React, { useState, useEffect } from 'react';
import MonacoEditor from "react-monaco-editor";
import { store } from '../store';

//TODO: Add code completion
interface Props {
    cellVM: ICodeCell
}

export const Editor: React.FC<Props> = ({ cellVM }) => {

    const options = {
        minimap: { enabled: false },
    }

    var model: monaco.editor.ITextModel | null

    const [height, setHeight] = useState(0)
    const [code, setCode] = useState(cellVM.source)

    const editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        editor.focus();
        model = editor.getModel()
        if (model) {
            setHeight((model.getLineCount() + 1) * 19)
        }
    }

    const onChange = (newValue: string) => {
        if (model) {
            const contentHeight = (model.getLineCount() + 1) * 19
            setHeight((model.getLineCount() + 1) * 19)
        }
        setCode(newValue)
        store.dispatch({ type: 'updateCellSource', payload: { cellVM: cellVM, source: newValue } })
    }

    useEffect(() =>
        setCode(cellVM.source)
        , [cellVM])

    return (
        <MonacoEditor
            height={height}
            theme="vs-dark"
            language={cellVM.language}
            value={code}
            options={options}
            onChange={onChange}
            editorDidMount={editorDidMount}
        />
    );
}
