"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const types_1 = require("./types");
// create cell
exports.createEmptyCodeCell = (id) => {
    let emptyCell = {
        id: id || uuid_1.v4(),
        type: types_1.CellType.CODE,
        source: '',
        language: 'python',
        kernelName: 'python3',
        backend: 'Jupyter',
        metadata: {
            scrollbar: true,
            source_hidden: false,
            output_hidden: false,
        },
        state: types_1.ICellState.Finished,
        outputs: [],
    };
    return emptyCell;
};
