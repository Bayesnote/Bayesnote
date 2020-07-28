import React, { useEffect, useState } from "react";
import { useDrop } from 'react-dnd';
import GridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { useSelector } from 'react-redux';
import "react-resizable/css/styles.css";
import { RootState, store } from "../store";
import { ChartContainer, ChartList } from "./chart";
const GridLayoutWidth = WidthProvider(GridLayout)

//TODO: resizable
//TODO: dashboardList
//TODO: consistent naming
export const Board: React.FC = () => {
    //TODO: remove this duplicate
    const ItemTypes = {
        CHART: 'chart',
    }

    const sourceCharts = useSelector((state: RootState) => state.chartListReducer.specs)
    const charts = useSelector((state: RootState) => state.dashboardReducer.charts)
    console.log("charts: ", charts)
    //TODO: set initial layout: minW? 
    const layouts = useSelector((state: RootState) => state.dashboardReducer.layouts)
    const [curLayouts, setCurLayouts] = useState(layouts)

    const [{ item }, drop] = useDrop({
        accept: ItemTypes.CHART,
        collect: (monitor) => ({
            item: monitor.getItem()
        }),
    })

    useEffect(() => {
        if (item) {
            store.dispatch({ type: "addChart", payload: { val: item.index } })
        }
    }, [item, sourceCharts]);

    const handleLayoutChange = (layouts: any) => {
        setCurLayouts(layouts)
    }

    return (
        <div ref={drop}>
            <GridLayoutWidth layout={curLayouts} onLayoutChange={handleLayoutChange}>
                {charts.map((chart, index) => <ChartContainer key={"chart" + index} id={"chart" + index} chartIndex={chart}/>)}
            </GridLayoutWidth>
        </div>
    );
};

//TODO: Fix 2 dashbaord reducer
const DashboardList = () => {
    const dashboard = useSelector((state: RootState) => state.dashboardReducer.charts)
    const layouts = useSelector((state: RootState) => state.dashboardReducer.layouts)
    //show
    const titles = useSelector((state: RootState) => state.dashboardListReducer.titles)
    const dashboardFromList = useSelector((state: RootState) => state.dashboardListReducer.dashboards)
    const layoutsFromList = useSelector((state: RootState) => state.dashboardListReducer.layouts)
    console.log("useSelector -> handleClick -> showBoard", dashboardFromList)
    //edit
    const [title, setTitle] = useState("")

    function handleSave() {
        store.dispatch({ type: "saveDashboard", payload: { dashboard: dashboard, layouts: layouts, title: title } })
    }

    function handleClick(index: any) {
        console.log("handleClick -> showBoard", dashboardFromList, layoutsFromList)
        store.dispatch({ type: "showBoard", payload: { dashboard: dashboardFromList[index], layouts: layoutsFromList[index] } })
    }

    return (
        <>
            <div>Dashboards: </div>
            <ul >
                {titles.map((title, index) => <li onClick={() => handleClick(index)}> {title}</li>)}
            </ul>

            <span>Dashboard Title: </span>
            <input type="text" onChange={e => setTitle(e.target.value)} />
            <button onClick={() => handleSave()}> Save </ button>
        </>
    )
}

export const DashboardNav: React.FC = () => {

    return <>
        <ChartList />
        <DashboardList />
    </>
}