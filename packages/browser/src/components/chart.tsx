import React from "react";
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import { Vega } from 'react-vega';
import { RootState, store } from '../store/index';

//TODO: SyntaxError: JSON Parse error: Unexpected identifier "None"
export const PreviewChart = () => {
    const spec = useSelector((state: RootState) => state.chartReducer.spec)

    // useEffect(() => {
    //     console.log("PreviewChart: ", spec)
    // }, [spec]);

    // const updateSpec = () => {
    //     if (chartData) {
    //         console.log("chartData:", chartData.replace(/'/g, '"'))
    //         const jsonData = JSON.parse(chartData.replace(/'/g, '"'))
    //         spec.data = { values: jsonData, format: { type: "json" } }
    //     }
    // }

    //    store.dispatch({ type: "spec", payload: { spec } })

    return (
        <div style={{ height: 300, width: 300 }}>
            < Vega spec={spec} actions={false} />
        </div>
    )
}

const ChartEdit = () => {
    const spec = useSelector((state: RootState) => state.chartReducer.spec)
    console.log("spec.data: ", spec.data)

    function handleSave() {
    }

    const handleSet = (val: string, field: string) => {
        store.dispatch({ type: field, payload: { val } })
    }

    //
    const getCols = (data: any) => {
        //No @types/compassql found
        const cql = require('compassql')
        var cols = [{ name: "none", vlType: "none" }]
        const schema = cql.schema.build(data);

        for (var col of schema._tableSchema.fields) {
            const { name, vlType } = col
            cols.push({ name: name, vlType: vlType })
        }
        return cols
    }

    //value={spec.title as string
    //e => handleSet(e.target.value, "title")
    return <div>
        <span> Title: </span>
        <input type="text" onChange={e => handleSet(e.target.value, "title")} />
        <p> </p>

        <p> </p>
        <span >Chart type:</span>
        <select onChange={e => { handleSet(e.target.value, "mark") }} value={spec.mark as string}>
            {["none", "area", "bar", "line", "point"].map((type, index: number) => <option key={index} >{type}</option>)}
        </select>

        {/* <p> </p>
        <span >X-axis:</span>
        <select onChange={e => { handleSet(e.target.value, "x") }} value={spec.encoding.x.field}>
            {schema.map((col, index: number) => <option key={index} >{col.name}</option>)}
        </select>
        <select onChange={e => { handleSet(e.target.value, "xtype") }} value={spec.encoding.x.type}>
            {fieldType.map((type, index: number) => <option key={index} >{type}</option>)}
        </select> */}

        <button onClick={() => handleSave()}> Save </ button>
    </div >

}

export const Chart = () => {

    return <div>
        <SplitPane split="vertical" minSize={300}>
            <PreviewChart />
            <ChartEdit />
        </SplitPane>
    </div>
}