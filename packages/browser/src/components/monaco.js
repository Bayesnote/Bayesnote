import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { store } from '../store';

//TODO: Migrate to tsx
//TODO: Add code completion
export class Editor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            //TODO: handle languages if not supported by Monaco
            //TODO: check change languages
            cellVM: props.cellVM,
            code: ``,
            height: 38,
            model: null
        }
    }

    editorDidMount(editor, monaco) {
        editor.focus();
        let model = monaco.editor.getModels()[0]
        this.setState({ model })
    }

    onChange(newValue, e) {
        console.log('onChange', newValue, e);
        const contentHeight = (this.state.model.getLineCount() + 1) * 19
        this.setState({ height: contentHeight, code: newValue })
        store.dispatch({ type: 'updateCellSource', payload: { cellVM: this.state.cellVM, source: newValue } })
    }

    render() {
        const code = this.state.code;
        const options = {
            minimap: { enabled: false },
            scrollbar: { vertical: 'hidden' },
        };

        return (
            <MonacoEditor
                ref="monaco"
                height={this.state.height}
                theme="vs-dark"
                language={this.state.cellVM.cell.language}
                value={code}
                options={options}
                onChange={this.onChange.bind(this)}
                editorDidMount={this.editorDidMount.bind(this)}
            />
        );
    }
}