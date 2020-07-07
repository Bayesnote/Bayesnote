import { v4 as uuid } from 'uuid'
import { ICellState, ICodeCell, CellType } from './types'

// create cell
export const createEmptyCodeCell = (id?: string): ICodeCell => {
    let emptyCell = {
        id: id || uuid(),
        type: CellType.CODE,
        source: '',
        language: 'python', // todo testing select python3 by default
        kernelName: 'python3',
        backend: 'Jupyter',
        metadata: {
            scrollbar: true,
            source_hidden: false,
            output_hidden: false,
        },
        state: ICellState.Finished,
        outputs: [],
    }
    return emptyCell;
}