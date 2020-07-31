import { ICodeCell, IKernelInfo, INotebook } from '@bayesnote/common/lib/types'
import { createEmptyCodeCell } from '@bayesnote/common/lib/utils'
import cloneDeep from 'lodash/cloneDeep'
import uniqBy from 'lodash/uniqBy'
import { store } from './index'

/* -------------------------------------------------------------------------- */
/*                                   cellVM                                   */
/* -------------------------------------------------------------------------- */
export const getCurrentCellVM = (cell: ICodeCell) => {
    let state = store.getState()
    let currentCells = state.notebookReducer.notebookVM.cells
    let index = currentCells.findIndex(item => item.id === cell.id)
    return currentCells[index]
}

export const cloneCurrentCellVM = (cell: ICodeCell) => {
    return cloneDeep(getCurrentCellVM(cell))
}

//TODO: redundant
export const createCellVM = (emptyCell: ICodeCell): ICodeCell => {
    return emptyCell
}

export const createEmptyCodeCellVM = (id?: string): ICodeCell => {
    let emptyCell = createEmptyCodeCell(id)
    let emptyCellVM = createCellVM(emptyCell)
    return emptyCellVM
}

/* -------------------------------------------------------------------------- */
/*                                 notebookVM                                 */
/* -------------------------------------------------------------------------- */
export const cloneNotebookVM = (notebookVM: INotebook) => {
    return cloneDeep(notebookVM)
}

export const getNotebookKernelInfo = (notebookVM: INotebook): IKernelInfo => {
    let cells = notebookVM.cells
    let info = cells.map(cell => ({
        language: cell.language,
        kernelName: cell.kernelName,
        backend: cell.backend
    })) // language in jupyter means kernel name
    info = uniqBy(info, 'language')
    return info
}