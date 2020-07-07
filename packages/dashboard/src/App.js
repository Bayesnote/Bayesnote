import * as cql from 'compassql';
import React, { useEffect, useState } from "react";
import { useDrag, useDrop } from 'react-dnd';
import GridLayout, { WidthProvider } from "react-grid-layout";
import { useDispatch, useSelector } from "react-redux";
import "react-resizable/css/styles.css";
import SplitPane from 'react-split-pane';
import { Vega } from 'react-vega';
import { store } from './index';
import { addChart, changeStyle, editChart, editColor, editData, editTitle, editX, editXType, editY, editYType, saveDashboard, saveSpec, setDashboard, setLayouts, setSpec } from './index.js';
const GridLayoutWidth = WidthProvider(GridLayout);

const ItemTypes = {
  CHART: 'chart',
}

//TODO: set dashboard name
//TODO: read dashboard
const DashboardList = () => {
  const dispatch = useDispatch();
  const dashboard = useSelector(state => state.dashboardReducer.charts)
  const layouts = useSelector(state => state.dashboardReducer.layouts)
  //show
  const titles = useSelector(state => state.dashboardListReducer.titles)
  const dashboardFromList = useSelector(state => state.dashboardListReducer.dashboards)
  const layoutsFromList = useSelector(state => state.dashboardListReducer.layouts)
  //edit
  const [title, setTitle] = useState("")

  function handleSave() {
    dispatch(saveDashboard(dashboard, layouts, title))
  }

  function handleClick(index) {
    dispatch(setDashboard(dashboardFromList[index], layoutsFromList[index]))
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

const Dashboard = () => {
  const dispatch = useDispatch();
  const [{ item }, drop] = useDrop({
    accept: ItemTypes.CHART,
    collect: (monitor) => ({
      item: monitor.getItem()
    }),
  })
  const sourceCharts = useSelector(state => state.chartListReducer)
  const charts = useSelector(state => state.dashboardReducer.charts)
  //TODO: set initial layout: minW? 
  const layouts = useSelector(state => state.dashboardReducer.layouts)

  useEffect(() => {
    if (item) {
      dispatch(addChart(sourceCharts[item.index]))
    }
  }, [item, sourceCharts, dispatch]);

  useEffect(() => {
    dispatch(setLayouts(layouts))
  }, [layouts, dispatch]);

  function handleLayoutChange(layouts) {
    dispatch(setLayouts(layouts))
  }

  return (
    <div ref={drop}>
      <GridLayoutWidth layout={layouts} onLayoutChange={handleLayoutChange}>
        {charts.map((chart, index) => <ChartContainer key={"chart" + index} id={"chart" + index} chart={chart} />)}
      </GridLayoutWidth>
    </div>
  );
};

/*             
 Chart        
*/
const EditChartPanel = () => {
  const dispatch = useDispatch();
  const spec = useSelector(state => state.chartReducer.spec)
  const [schema, setSchema] = useState(getSchema(spec.data.name))
  const dataArray = Object.keys(require(`vega-datasets/`).default)
  const fieldType = ["none", "quantitative", "ordinal", "nominal"]

  function getSchema(name) {
    var cols = [{ name: "none", vlType: "none" }]

    if (name === "" || name === undefined) {
      return cols
    }
    const data = require(`vega-datasets/data/${name}`);
    var schema = cql.schema.build(data);
    for (var col of schema._tableSchema.fields) {
      const { name, vlType } = col
      cols.push({ name: name, vlType: vlType })
    }
    return cols
  }

  useEffect(() => {
    setSchema(getSchema(spec.data.name))
  }, [spec]);

  //TODO: check duplicate keys
  function handleSave() {
    dispatch(saveSpec(store.getState().chartReducer.spec))
  }

  function handleSet(value, type) {
    switch (type) {
      case "data":
        dispatch(editData(value))
        setSchema(getSchema(value))
        return
      case "title":
        dispatch(editTitle(value))
        return
      case "chart":
        dispatch(editChart(value))
        return
      case "x":
        dispatch(editX(value))
        return
      case "xtype":
        dispatch(editXType(value))
        return
      case "y":
        dispatch(editY(value))
        return
      case "ytype":
        dispatch(editYType(value))
        return
      case "color":
        dispatch(editColor(value))
        return
      default:
        return
    }
  }

  //TODO: support pie chart and more 
  //TODO: Warning: A component is changing an uncontrolled input of type text to be controlled.
  //TODO: cannot change value
  return (
    <div>

      <span >Data:</span>
      <select onChange={e => { handleSet(e.target.value, "data") }} value={spec.data.name}>
        {dataArray.map((data, index: number) => <option key={index} >{data}</option>)}
      </select>

      <p> </p>
      <span>Edit Title: </span>
      <input type="text" onChange={e => handleSet(e.target.value, "title")} value={spec.title} />

      <p> </p>
      <span >Chart type:</span>
      <select onChange={e => { handleSet(e.target.value, "chart") }} value={spec.mark}>
        {["none", "area", "bar", "line", "point"].map((type, index: number) => <option key={index} >{type}</option>)}
      </select>

      <p> </p>
      <span >X-axis:</span>
      <select onChange={e => { handleSet(e.target.value, "x") }} value={spec.encoding.x.field}>
        {schema.map((col, index: number) => <option key={index} >{col.name}</option>)}
      </select>
      <select onChange={e => { handleSet(e.target.value, "xtype") }} value={spec.encoding.x.type}>
        {fieldType.map((type, index: number) => <option key={index} >{type}</option>)}
      </select>

      <p> </p>
      <span >Y-axis:</span>
      <select onChange={e => { handleSet(e.target.value, "y") }} value={spec.encoding.y.field}>
        {schema.map((col, index: number) => <option key={index} >{col.name}</option>)}
      </select>
      <select onChange={e => { handleSet(e.target.value, "ytype") }} value={spec.encoding.y.type}>
        {fieldType.map((type, index: number) => <option key={index} >{type}</option>)}
      </select>

      <p> </p>
      <span >Break by:</span>
      <select onChange={e => { handleSet(e.target.value, "color") }} value={spec.encoding.color.field}>
        {schema.map((col, index: number) => <option key={index} >{col.name}</option>)}
      </select>

      <p> </p>
      <button onClick={() => handleSave()}> Save </ button>

    </div>
  )
}

//TODO: add preview of chart
const ChartList = () => {
  const dispatch = useDispatch();
  const specs = useSelector(state => state.chartListReducer) //
  // console.log(specs)

  //TODO: does not work
  function handleClick(index) {
    //set spec to selection
    dispatch(setSpec(specs[index]))
    //render spec
  }

  const titlesList = specs.map((spec, index) =>
    <li >
      <ChartItem index={index} spec={spec} onClick={() => handleClick(index)} />
    </li>
  )

  return (
    <>
      <span>Charts: </span>
      <ul>{titlesList}</ul>
    </>
  )
}

const ChartItem = ({ spec, index }) => {
  const [{ isDragging }, drag] = useDrag({
    item: { index: index, type: ItemTypes.CHART },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
  })

  return (
    <div ref={drag}>
      {spec.title}
    </div>
  )
}

const PreviewChart = () => {
  const spec = useSelector(state => state.chartReducer.spec)
  console.log(spec)

  return (
    < Vega spec={spec} actions={false} />
  )
}


//TODO: width & height redudant
const ChartContainer = ({ children, id, chart, style, ...props }) => {
  const dispatch = useDispatch();
  const width = parseInt(style.width, 10) - 10; //Match draggable handle
  const height = parseInt(style.height, 10);

  useEffect(() => {
    dispatch(changeStyle(width, height))
  }, [width, height, dispatch])

  return (
    <div className="grid-item_graph" style={style} {...props}>
      {<Vega spec={chart} actions={false} width={width} height={height} />}
      {children}
    </div>
  )
};




function App() {
  return (
    <>
      <SplitPane split="vertical" defaultSize="33%">
        <SplitPane split="horizontal" defaultSize="33%">
          <EditChartPanel />
          <SplitPane split="horizontal" defaultSize="33%">
            <PreviewChart />
            <SplitPane split="horizontal" defaultSize="33%">
              <ChartList />
              <DashboardList />
            </SplitPane>
          </SplitPane>
        </SplitPane>
        <Dashboard />
      </SplitPane>
    </>
  )
}

export default App;
