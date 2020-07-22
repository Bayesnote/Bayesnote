import React, { useEffect } from "react";
import { useDrop } from 'react-dnd';
import GridLayout, { WidthProvider } from "react-grid-layout";
import { useSelector } from 'react-redux';
import { RootState, store } from "../store";
import { ChartContainer } from "./chart";
const GridLayoutWidth = WidthProvider(GridLayout)

//TODO: read/write storage
//TODO: resizable
//TODO: dashboardList
export const Board: React.FC = () => {
    //TODO: remove this duplicate
    const ItemTypes = {
        CHART: 'chart',
    }

    const sourceCharts = useSelector((state: RootState) => state.chartListReducer.specs)
    const charts = useSelector((state: RootState) => state.dashboardReducer.charts)
    //TODO: set initial layout: minW? 
    const layouts = useSelector((state: RootState) => state.dashboardReducer.layouts)

    const [{ item }, drop] = useDrop({
        accept: ItemTypes.CHART,
        collect: (monitor) => ({
            item: monitor.getItem()
        }),
    })

    useEffect(() => {
        if (item) {
            store.dispatch({ type: "addChart", payload: { val: sourceCharts[item.index] } })
        }
    }, [item, sourceCharts]);

    // useEffect(() => {
    //     store.dispatch({ type: "setLayouts", payload: { val: layouts } })
    // }, [layouts]);

    const handleLayoutChange = (layouts: any) => {
        store.dispatch({ type: "setLayouts", payload: { val: layouts } })
    }

    return (
        <div ref={drop}>
            <GridLayoutWidth layout={layouts} onLayoutChange={handleLayoutChange}>
                {charts.map((chart, index) => <ChartContainer key={"chart" + index} id={"chart" + index} chart={chart} />)}
            </GridLayoutWidth>
        </div>
    );
};
