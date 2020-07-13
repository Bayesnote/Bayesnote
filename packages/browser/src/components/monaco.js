import React from 'react';
import MonacoEditor from 'react-monaco-editor';

//TODO: Migrate to tsx
//TODO: Add code completion
//TODO: Wire to language selection
export class Editor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            code: ``,
            height: 57,
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
                value={code}
                options={options}
                onChange={this.onChange.bind(this)}
                editorDidMount={this.editorDidMount.bind(this)}
            />
        );
    }
}