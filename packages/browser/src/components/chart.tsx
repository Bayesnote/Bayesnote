import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import { Vega } from 'react-vega';
import { RootState, store } from '../store/index';

//FIXME: Chart edit cause output re-render
export const PreviewChart = () => {
    const spec = useSelector((state: RootState) => state.chartReducer.spec)
    // console.log(spec.data)
    return (
        <div style={{ height: 300, width: 300 }}>
            < Vega spec={spec} actions={false} />
        </div>
    )
}

const ChartEdit = () => {
    const fieldType = ["none", "quantitative", "ordinal", "nominal"]
    const spec = useSelector((state: RootState) => state.chartReducer.spec)
    const [cols, setCols] = useState([] as string[])

    function handleSave() {
    }

    const handleSet = (val: string, field: string) => {
        store.dispatch({ type: field, payload: { val } })
    }

    const getCols = (vals: any) => {
        if (vals) {
            return Object.keys(JSON.parse(vals)[0])
        }
        return [] as string[]
    }

    useEffect(() => {
        setCols(getCols((spec.data as any).values))
    }, [spec.data]);

    return <div>
        <span> Title: </span>
        <input type="text" onChange={e => handleSet(e.target.value, "title")} />
        <p> </p>

        <p> </p>
        <span >Chart type:</span>
        <select onChange={e => { handleSet(e.target.value, "mark") }} value={spec.mark as string}>
            {["none", "area", "bar", "line", "point"].map((type, index: number) => <option key={index} >{type}</option>)}
        </select>

        <p> </p>
        <span >X-axis:</span>
        <select onChange={e => { handleSet(e.target.value, "x") }} value={(spec.encoding!.x! as any).field as string}>
            {cols.map((col, index: number) => <option key={index} >{col}</option>)}
        </select>
        <select onChange={e => { handleSet(e.target.value, "xtype") }} value={(spec.encoding!.x! as any).type as string}>
            {fieldType.map((type, index: number) => <option key={index} >{type}</option>)}
        </select>

        <p> </p>
        <span >Y-axis:</span>
        <select onChange={e => { handleSet(e.target.value, "y") }} value={(spec.encoding!.y! as any).field as string}>
            {cols.map((col, index: number) => <option key={index} >{col}</option>)}
        </select>
        <select onChange={e => { handleSet(e.target.value, "ytype") }} value={(spec.encoding!.y! as any).type as string}>
            {fieldType.map((type, index: number) => <option key={index} >{type}</option>)}
        </select>

        <p> </p>
        <span >Break by:</span>
        <select onChange={e => { handleSet(e.target.value, "color") }} value={(spec.encoding!.color! as any).field as string}>
            {cols.map((col, index: number) => <option key={index} >{col}</option>)}
        </select>

        <p> </p>
        <button onClick={() => handleSave()}> Save </ button>
    </div >

}

export const Chart = ({ renderChart }: { renderChart: boolean }) => {

    if (renderChart) {
        return <div>
            <SplitPane split="vertical" minSize={400}>
                <PreviewChart />
                <ChartEdit />
            </SplitPane>
        </div>
    }

    return null
}