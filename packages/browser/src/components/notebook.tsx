import { ICellViewModel, INotebookViewModel } from '@bayesnote/common/lib/types.js'
import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import SplitPane from 'react-split-pane'
import client from '../socket'
import Cell from './cell'
import Libraries from './libraries'

interface IState {
    notebookVM: INotebookViewModel
}

const Notebook: React.FC<IState> = ({ notebookVM }) => {
    //TODO: rename
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
            <SplitPane split="vertical" defaultSize="5%">
                <div>Place Holder</div>
                <SplitPane split="vertical" defaultSize="15%">
                    <div style={{ maxHeight: "80%", overflow: 'auto' }}>   <Libraries url={"dummyString"} /></div>
                    {/* <MainToolbar /> */}
                    {getContent()}
                </SplitPane>
            </SplitPane>
        </>
    )
}

const mapStateToProps = (state: IState) => ({ notebookVM: state.notebookVM })

export default connect(mapStateToProps)(Notebook)
