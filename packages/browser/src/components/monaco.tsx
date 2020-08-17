import { ICodeCell } from '@bayesnote/common/lib/types.js';
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import React, { useEffect, useState } from 'react';
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

    const [model, setModel] = useState<monaco.editor.ITextModel>()
    const [height, setHeight] = useState(0)
    const [code, setCode] = useState(cellVM.source)

    const editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        editor.focus();
        if (editor.getModel()) {
            setModel(editor.getModel() as monaco.editor.ITextModel)
            setHeight((editor.getModel()!.getLineCount() + 1) * 19)
        }
    }

    const onChange = (newValue: string, event: monaco.editor.IModelContentChangedEvent) => {
        if (model) {
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
