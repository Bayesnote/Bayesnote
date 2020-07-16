import { CellType, ICell, ICellState } from '@bayesnote/common/lib/types.js'

export function exampleMultiLanguages(): { cells: ICell[] } {
    return {
        cells: [
            {
                id: '4e698ede-c098-4d84-bbce-516d448c4f97',
                type: CellType.CODE,
                source: '# Bayesnote Supports multiple languages: Python, SQL, R, Spark etc.\n# Python. \nfruits = [\'Banana\', \'Apple\', \'Lime\']\nfruits',
                language: 'python',
                kernelName: 'python3',
                backend: 'Jupyter',
                metadata: {
                    scrollbar: false,
                    source_hidden: false,
                    output_hidden: false
                },
                outputs: [],
                state: ICellState.Finished,
            }, {
                id: 'a53f768a-1858-4f03-86f6-09c10a1a0f5c',
                type: CellType.CODE,
                source: "# R \nvar.1 = c(0,1,2,3)\nvar.1",
                language: 'r',
                kernelName: 'r',
                backend: 'Jupyter',
                metadata: {
                    scrollbar: false,
                    source_hidden: false,
                    output_hidden: false
                },
                outputs: [],
                state: ICellState.Finished,
            },
            {
                id: '9ef575ed-7882-4233-829a-fbbd58eee0e1',
                type: CellType.CODE,
                source: "# Spark(Scala) \nspark.version",
                language: 'scala',
                kernelName: 'Apache Toree - Scala',
                backend: 'Jupyter',
                metadata: {
                    scrollbar: false,
                    source_hidden: false,
                    output_hidden: false
                },
                outputs: [],
                state: ICellState.Finished,
            },
        ]
    }
}

export function exampleVariableSharing(): { cells: ICell[] } {
    return {
        cells: [
            {
                id: '4e698ede-c098-4d84-bbce-516d448c4f97',
                type: CellType.CODE,
                source: '#Variables can be shared between different languages, including Python, SQL, R, Spark etc.\n#Python. \nfruits = [\'Banana\', \'Apple\', \'Lime\']',
                language: 'python',
                kernelName: 'python3',
                backend: 'Jupyter',
                metadata: {
                    scrollbar: false,
                    source_hidden: false,
                    output_hidden: false
                },
                outputs: [],
                state: ICellState.Finished,
            }, {
                id: 'a53f768a-1858-4f03-86f6-09c10a1a0f5c',
                type: CellType.CODE,
                source: "#R \nprint(temp_var)",
                language: 'R',
                kernelName: 'ir',
                backend: 'Jupyter',
                metadata: {
                    scrollbar: false,
                    source_hidden: false,
                    output_hidden: false
                },
                outputs: [],
                state: ICellState.Finished,
            },
            {
                id: '9ef575ed-7882-4233-829a-fbbd58eee0e1',
                type: CellType.CODE,
                source: "#R \nname = \"Bayes\"\n ",
                language: 'R',
                kernelName: 'ir',
                backend: 'Jupyter',
                metadata: {
                    scrollbar: false,
                    source_hidden: false,
                    output_hidden: false
                },
                outputs: [],
                state: ICellState.Finished,
            },
            {
                id: '646ace57-6412-49d1-95aa-a44846fa401a',
                type: CellType.CODE,
                source: "#Python\nprint(name)",
                language: 'python',
                kernelName: 'python3',
                backend: 'Jupyter',
                metadata: {
                    scrollbar: false,
                    source_hidden: false,
                    output_hidden: false
                },
                outputs: [],
                state: ICellState.Finished,
            }
        ]
    }
}

export function parameterExampleCells(): { cells: ICell[] } {
    return {
        cells: [{
            id: '646ace57-6412-49d1-95aa-a44846fa401a',
            type: CellType.PARAMETER,
            source: "myList = ['oliver', 'alice', 'troy']\ndelay = 1",
            language: 'javascript',
            kernelName: 'javascript',
            backend: 'Jupyter',
            metadata: {
                scrollbar: false,
                source_hidden: false,
                output_hidden: false
            },
            outputs: [],
            state: ICellState.Finished,
        }, {
            id: '3df31bb7-49d2-4632-8d8b-246204313b7e',
            type: CellType.CODE,
            source: "from time import sleep\n\nfor name in myList:\n  sleep(float(delay))\n  print(name)\n",
            language: 'python',
            kernelName: 'python3',
            backend: 'Jupyter',
            metadata: {
                scrollbar: false,
                source_hidden: false,
                output_hidden: false
            },
            outputs: [],
            state: ICellState.Finished,
        }]
    }
}