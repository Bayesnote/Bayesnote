import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, store } from '../store';
import { Libraries } from './libraries';

export const Spark: React.FC = () => {
    return <div>
        <AddCluster />
        <ClusterList />
        <Libraries />
    </div>
}

//TODO: Add popup status of change status
const ClusterList: React.FC = () => {
    // list clusters
    const clusters = useSelector((state: RootState) => state.sparkReducer.clusters)

    // select clusters
    const handleClick = (cluster: string) => {
        //TODO: Add dialog
        const sparkCluster: sparkCluster = {
            User: "",
            IP: cluster,
            Port: "",
            Password: "",
            Pem: ""
        }

        fetch("http://localhost:9292/clusters", {
            method: 'POST',
            body: JSON.stringify(sparkCluster),
        });
    }

    return <ul>
        {clusters.map((cluster, index) => <li key={index} onClick={() => handleClick(cluster)}> {cluster} </li>)}
    </ul>
}

const AddCluster: React.FC = () => {
    const [input, setInput] = useState("");

    const handleAdd = () => {
        store.dispatch({ type: "addSparkClusters", payload: { input }, });
    }

    return <div>
        <input type="text" onChange={e => setInput(e.target.value)} />
        <button type="button" onClick={handleAdd}>
            Add Spark cluster
      </button>
    </div>
}

interface sparkCluster {
    User: string
    IP: string
    Port: string
    Password?: string
    Pem?: string
}