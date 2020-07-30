import { ICodeCell } from '@bayesnote/common/lib/types.js';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import client from '../socket';
import { RootState, store } from '../store/index';
import { Cell } from './cell';

export const Notebook: React.FC = () => {
    const notebookVM = useSelector((state: RootState) => state.notebookReducer.notebookVM)

    //TODO: rename
    const loadCells = () => {
        return notebookVM.cells.map(
            (cellVM: ICodeCell) => {
                return <Cell key={cellVM.id} cellVM={cellVM} />
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
                <div style={{ float: "right" }}>
                    < NotebookToolbar />
                </div>
                {loadCells()}
            </div>
        </>
    )
}

const NotebookToolbar: React.FC = () => {
    const notebookVM = useSelector((state: RootState) => state.notebookReducer.notebookVM)
    const [name, setName] = useState("");

    //TODO:
    const handleNew = () => {

    }

    const handleSave = () => {
        store.dispatch({
            type: "updateNotebookName",
            payload: { name },
        });
        client.emit("notebook.save", notebookVM)
    }

    return <div>
        <input type="text" onChange={e => setName(e.target.value)} />
        <button onClick={handleNew}>New</button>
        <button onClick={handleSave}>Save</button>
    </div>
}