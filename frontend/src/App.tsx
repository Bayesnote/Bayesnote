import React from 'react';
import { RecoilRoot } from 'recoil';
import './App.css';
import { Grid } from './components/grid';
import { NavBar } from './components/navbar';

function App() {
    return (
        <RecoilRoot>
            <NavBar />
            <Grid />
        </RecoilRoot>
    );
}

export default App;
