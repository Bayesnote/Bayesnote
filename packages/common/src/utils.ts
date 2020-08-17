import { v4 as uuid } from 'uuid';
import { CellType, ICellState, ICodeCell } from './types';

// create cell
//TODO: https://stackoverflow.com/questions/30734509/how-to-pass-optional-parameters-while-omitting-some-other-optional-parameters
export const createEmptyCodeCell = (id?: string, language?: string, kernelName?: string, source?: string): ICodeCell => {
    let emptyCell = {
        id: id || uuid(),
        type: CellType.CODE,
        source: source || '',
        language: language || 'python', // todo testing select python3 by default
        kernelName: kernelName || 'python3',
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