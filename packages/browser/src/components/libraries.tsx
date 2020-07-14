import React, { useEffect, useState } from "react";

interface Props {
    url: string
}
//TODO: Install packages from pip, conda, maven central
const Libraries: React.FC<Props> = ({ url }) => {
    const [pipPackages, setPipPackages] = useState([] as pipPackages[])
    const [input, setInput] = useState("");

    //url example: http://localhost:80/containers/406fe37f4397bbb89523f40c5a5108d5e5fbb5541cef098b85b0665384866512/pip
    async function fetchData() {
        fetch(url)
            .then(response => response.json())
            .then(data => setPipPackages(data))
    }

    useEffect(() => {
        fetchData()
    })

    const listItems = pipPackages.map((pipPackage) => <li key={pipPackage.name}>{pipPackage.name + "-" + pipPackage.version}</li>)

    return <div>
        {/* <input type="text" onChange={e => setInput(e.target.value)} />
        <button type="button" onClick={handleInstall}>
            Install
      </button> */}
        <ul style={{ listStyleType: "none", fontSize: '12px' }}>{listItems}</ul>
    </div>

}

interface pipPackages {
    name: string
    version: string
}

export default Libraries