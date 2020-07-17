import { ICell, INotebookViewModel, IKernelInfo, ICodeCell, ICellViewModel } from '@bayesnote/common/lib/types'
import { store } from './index'
import cloneDeep from 'lodash/cloneDeep'
import uniqBy from 'lodash/uniqBy'
import { createEmptyCodeCell } from '@bayesnote/common/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                   cellVM                                   */
/* -------------------------------------------------------------------------- */
export const getCurrentCellVM = (cell: ICell) => {
    let state = store.getState()
    let currentCells = state.notebookReducer.notebookVM.notebook.cells
    let index = currentCells.findIndex(item => item.cell.id === cell.id)
    return currentCells[index]
}

export const cloneCurrentCellVM = (cell: ICell) => {
    return cloneDeep(getCurrentCellVM(cell))
}

export const createCellVM = (emptyCell: ICodeCell): ICellViewModel => {
    let emptyCellVM = {
        cell: emptyCell,
        exportd: ''
    }
    return emptyCellVM
}

export const createEmptyCodeCellVM = (id?: string): ICellViewModel => {
    let emptyCell = createEmptyCodeCell(id)
    let emptyCellVM = createCellVM(emptyCell)
    return emptyCellVM
}

/* -------------------------------------------------------------------------- */
/*                                 notebookVM                                 */
/* -------------------------------------------------------------------------- */
export const cloneNotebookVM = (notebookVM: INotebookViewModel) => {
    return cloneDeep(notebookVM)
}

export const getNotebookKernelInfo = (notebookVM: INotebookViewModel): IKernelInfo => {
    let cells = notebookVM.notebook.cells
    let info = cells.map(cell => ({
        language: cell.cell.language,
        kernelName: cell.cell.kernelName,
        backend: cell.cell.backend
    })) // language in jupyter means kernel name
    info = uniqBy(info, 'language')
    return info
}