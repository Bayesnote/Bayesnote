import React from "react";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChartList } from "./chart";

export const Dashboard: React.FC = () => {

    return <>
        <DndProvider backend={HTML5Backend}>
            <  ChartList />
        </DndProvider>
    </>
}