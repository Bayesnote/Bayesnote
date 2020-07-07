import React from "react";
import { Provider } from 'react-redux';
import "./app.css";
import Notebook from './components/notebook';
import { store } from './store';

const App: React.FC = () => {
  return (
    <div className="App" >
      <Provider store={store}>
        <Notebook />
      </Provider>
    </div>
  )
}

export default App
