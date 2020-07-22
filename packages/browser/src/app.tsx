import React from "react";
import { Provider } from 'react-redux';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';
import SplitPane from 'react-split-pane';
import "./app.css";
import { Dashboard } from './components/dashboard';
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
                  <Route path='/dashboard' component={Dashboard} />
                </Switch>
              </div>
              <div className="Panel-3" style={{ overflowY: "scroll" }}>
                <Switch>
                  <Route path='/notebooks' component={Notebook} />
                  <Route path='/workflow' component={Flow} />
                </Switch>
              </div>
            </SplitPane>
          </SplitPane>
        </Provider>
      </BrowserRouter>
    </div >
  )
}

export default App
