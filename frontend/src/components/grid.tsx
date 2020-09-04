import { Card } from "@blueprintjs/core";
import React from "react";
import GridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { FlowList, FlowRun, NewFlow } from "./flows";
import { AddHost, HostList } from "./hosts";
const GridLayoutWidth = WidthProvider(GridLayout)

/*
TODOs:
- change font size to 12px
- add draggable handle
- fix double calls
*/
export const Grid: React.FC = () => {
    const layout = [
        { i: 'c0', x: 0, y: 0, w: 2, h: 16 },
        { i: 'c1', x: 2, y: 0, w: 2, h: 16 },
        { i: 'c2', x: 4, y: 0, w: 4, h: 16 },
        { i: 'c3', x: 8, y: 0, w: 2, h: 16 },
        { i: 'c4', x: 12, y: 0, w: 2, h: 16 },
    ];

    const components = [<AddHost />, <HostList />, <FlowRun />, <FlowList />, <NewFlow />]

    return (
        <GridLayoutWidth className="layout" layout={layout} cols={12} rowHeight={30}>
            {components.map((component, idx) => <div key={'c' + idx}><CardContainer component={component} /></div>)}
        </GridLayoutWidth>
    )
}

interface Props {
    component: any
}

const CardContainer: React.FC<Props> = ({ component }) => {
    return (
        <>
            <Card elevation={1} >
                {component}
            </Card>
        </>
    )
}
