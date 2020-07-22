import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Provider } from 'react-redux';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';
import SplitPane from 'react-split-pane';
import "./app.css";
import { ChartList } from "./components/chart";
import { Board } from './components/dashboard';
import { Examples } from './components/examples';
import { Libraries } from "./components/libraries";
import { Notebook } from './components/notebook';
import { Flow } from './components/workflow';
import { store } from './store';

const App: React.FC = () => {
  return (
    <div className="App" >
      <BrowserRouter>
        <Provider store={store}>
          <DndProvider backend={HTML5Backend}>
            <SplitPane split="vertical" defaultSize="5%" >
              <div className="Panel-1" >
                <Link to="/notebooks" >Notebooks </Link>
                <Link to="/workflow">Workflow </Link>
                <Link to="/dashboard" >Dashboard </Link>
                <Link to="/" >Models </Link>
                <Link to="/libraries">Libraries </Link>
                <Link to="/">Containers </Link>
              </div>
              <SplitPane split="vertical" defaultSize="15%" pane2Style={{ overflow: 'scroll' }} style={{ position: 'relative' }}>
                <div className="Panel-2" style={{ maxHeight: "80%" }}>
                  <Switch>
                    <Route path='/notebooks' component={Examples} />
                    <Route path='/libraries' component={Libraries} />
                    <Route path='/dashboard' component={ChartList} />
                  </Switch>
                </div>
                <div className="Panel-3" style={{ overflowY: "scroll" }}>
                  <Switch>
                    <Route path='/notebooks' component={Notebook} />
                    <Route path='/workflow' component={Flow} />
                    <Route path='/dashboard' component={Board} />
                  </Switch>
                </div>
              </SplitPane>
            </SplitPane>
          </DndProvider>
        </Provider>
      </BrowserRouter>
    </div >
  )
}

export default App
