import React, { useEffect } from 'react'
import { ICellViewModel, INotebookViewModel } from '@bayesnote/common/lib/types.js'
import Cell from './cell'
import { connect } from 'react-redux'
import MainToolbar from './main-toolbar'
import client from '../socket'

interface IState {
    notebookVM: INotebookViewModel
}

const Notebook: React.FC<IState> = ({ notebookVM }) => {
    const getContent = () => {
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
            <MainToolbar />
            {getContent()}
        </>
    )
}

const mapStateToProps = (state: IState) => ({ notebookVM: state.notebookVM })

export default connect(mapStateToProps)(Notebook)
