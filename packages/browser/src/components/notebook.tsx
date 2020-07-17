import { ICellViewModel } from '@bayesnote/common/lib/types.js';
import React, { useEffect } from 'react';
import client from '../socket';
import { store } from '../store';
import {Cell} from './cell';

// interface IState {
//     notebookVM: INotebookViewModel
// }

export const Notebook: React.FC = () => {
    const notebookVM = store.getState().notebookReducer.notebookVM
    //TODO: rename
    const loadCells = () => {
        return notebookVM.notebook.cells.map(
            (cellVM: ICellViewModel) => {
                return <Cell key={cellVM.cell.id} cellVM={cellVM} />
            })
    }

    const getKernels = () => {
        client.emit('kernel.list')
    }

    const getRunningKernels = () => {
        client.emit('kernel.running.list')
    }

    useEffect(() => {
        getKernels()
        setInterval(() => {
            getRunningKernels()
        }, 2000)
    }, [])

    return (
        <>
            <div style={{ width: "80%" }}>
                {loadCells()}
            </div>
        </>
    )
}

// const mapStateToProps = (state: IState) => ({ notebookVM: state.notebookVM })

// export default connect(mapStateToProps)(Notebook)
