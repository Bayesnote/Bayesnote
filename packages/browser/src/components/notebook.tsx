import { ICellViewModel } from '@bayesnote/common/lib/types.js';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import client from '../socket';
import { RootState } from '../store/index';
import { Cell } from './cell';

export const Notebook: React.FC = () => {
    const notebookVM = useSelector((state: RootState) => state.notebookReducer.notebookVM)

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
