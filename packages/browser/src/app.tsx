import React from "react";
import { Provider } from 'react-redux';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';
import SplitPane from 'react-split-pane';
import "./app.css";
import Libraries from "./components/libraries";
import { Examples } from './components/main-toolbar';
import { Notebook } from './components/notebook';
import { Flow } from './components/workflow';
import { store } from './store';

const App: React.FC = () => {
  return (
    <div className="App" >
      <BrowserRouter>
        <Provider store={store}>
          <SplitPane split="vertical" defaultSize="5%">
            <div className="Panel-1" >
              <Link to="/notebooks" style={{ color: "#FFF", textDecoration: 'none' }}>Notebooks </Link>
              <Link to="/workflow" style={{ color: "#FFF", textDecoration: 'none' }}>Workflow </Link>
              <Link to="/" style={{ color: "#FFF", textDecoration: 'none' }}>Dashboard </Link>
              <Link to="/" style={{ color: "#FFF", textDecoration: 'none' }}>Models </Link>
              <Link to="/libraries" style={{ color: "#FFF", textDecoration: 'none' }}>Libraries </Link>
              <Link to="/" style={{ color: "#FFF", textDecoration: 'none' }}>Containers </Link>
              {/* <Link to="/" style={{ color: "#FFF", textDecoration: 'none' }}>Clusters </Link>
              <Link to="/" style={{ color: "#FFF", textDecoration: 'none' }}>Databases </Link> */}
            </div>
            <SplitPane split="vertical" defaultSize="15%" pane2Style={{ overflow: 'scroll' }} style={{ position: 'relative' }}>
              <div className="Panel-2" style={{ maxHeight: "80%" }}>
                <Switch>
                  <Route path='/notebooks' component={Examples} />
                  <Route path='/libraries' component={Libraries} />
                </Switch>
              </div>
              <div className="Panel-3" style={{ overflowY: "auto" }}>
                <Switch>
                  <Route path='/notebooks' component={Notebook} />
                  <Route path='/workflow' component={Flow} />
                </Switch>
              </div>
            </SplitPane>
          </SplitPane>
        </Provider>
      </BrowserRouter>
    </div>
  )
}

export default App
