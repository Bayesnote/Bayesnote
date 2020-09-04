import { Button, ControlGroup, Divider, FormGroup, InputGroup } from "@blueprintjs/core";
import React, { useEffect, useState } from "react";
import { atom, selector, useRecoilState, useRecoilValue } from "recoil";
import { AppToaster } from "./toasters";

const baseURL = "http://127.0.0.1:9000"

export const hostRefresh = atom({
    key: 'hostRefresh', // unique ID (with respect to other atoms/selectors)
    default: 0, // default value (aka initial value)
});

//TODO: select or drag & drop pem
export const AddHost: React.FC = () => {
    const [ip, setIP] = useState("")
    const [user, setUser] = useState("")
    const [password, setPassword] = useState("")
    const [pem, setPem] = useState("")
    const [count, setCount] = useRecoilState(hostRefresh);

    const handleSave = () => {
        const url = baseURL + "/hosts"
        const host = {
            "User": user,
            "IP": ip,
            "Password": password,
            "Pem": pem
        }

        fetch(url,
            {
                method: 'post',
                body: JSON.stringify(host)
            })
            .then(response => response.json())
            .then(result => {
                if (result.error != null) {
                    showToast(result.error)
                } else {
                    showToast(result.message)
                }
            })
            .catch(error => {
                alert(error)
            });
    }

    const handleInstall = () => {
        const url: string = baseURL + "/hosts/" + ip

        fetch(url,
            {
                method: 'post',
            })
            .then(response => response.json())
            .then(result => {
                if (result.error != null) {
                    showToast(result.error)
                } else {
                    showToast(result.message)
                    setCount(count + 1)
                }
            })
            .catch(error => {
                alert(error)
            });

        alert("Installing. This can take up to 10 mins depending on network conditions.")
    }

    //TODO: add progress bar    
    const showToast = (msg: string) => {
        AppToaster.show({ message: msg, intent: "primary" });
    }

    return (
        <div className="add-host">

            <ControlGroup fill={false} vertical={true}>

                <h4>Hosts: Add </h4>
                <Divider />

                <h5>1. Input: </h5>
                <Divider />

                <FormGroup
                    helperText=""
                    label="IP"
                    labelFor="text-input"
                    labelInfo="(required)"
                >
                    <InputGroup id="text-input"
                        placeholder="127.0.0.1"
                        value={ip}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIP(e.target.value)} />
                </FormGroup>

                <FormGroup
                    helperText=""
                    label="User name"
                    labelFor="text-input"
                    labelInfo="(required)"
                >
                    <InputGroup id="text-input"
                        placeholder="ubuntu"
                        value={user}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUser(e.target.value)} />
                </FormGroup>

                <FormGroup
                    helperText=""
                    label="Password"
                    labelFor="text-input"
                >
                    <InputGroup id="text-input"
                        placeholder="myPassword"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
                </FormGroup>

                <FormGroup label="Pem">
                    <InputGroup placeholder="/Users/Downloads/us-west-2.pem"
                        value={pem}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPem(e.target.value)} />
                </FormGroup>

                <Divider />

                <h5>2. Save: </h5>


                <Button text="Save" onClick={handleSave} />
                <br></br>
                <Divider />

                <h5>3. Install: </h5>

                <Button text="Install" onClick={handleInstall} />

            </ControlGroup>

        </div >
    )
}

export interface host {
    ID: string
    IP: string,
}

//TODO: open browser lagging
export const HostList: React.FC = () => {
    const url = baseURL + "/hosts"
    const [hosts, setHosts] = useState<host[]>([])
    const hostRefreshTarget = selector({
        key: 'hostRefreshTarget', // unique ID (with respect to other atoms/selectors)
        get: ({ get }) => {
            return get(hostRefresh)
        },
    });

    const count = useRecoilValue(hostRefreshTarget);

    useEffect(() => {
        async function fetchData() {
            const res = await fetch(url);
            res
                .json()
                .then(res => setHosts(res))
                .catch(err => alert(err));
        }

        fetchData()
    }, [url, count])

    const setRows = () => {
        return hosts.map((host, index) =>
            <tbody key={index}>
                <tr>
                    <td>{host.IP}</td>
                    <td>  <Button text="Notebook" onClick={() => handleClick(host.IP)} /></td>
                </tr>
            </tbody>
        )
    }

    const handleClick = (IP: string) => {
        const url = baseURL + "/notebooks/" + IP
        fetch(url,
            {
                method: 'post',
            })
            .then(response => response.json())
            .then(result => {
                if (result.error !== undefined) {
                    alert(result.error)
                } else {
                    alert(result.message)
                }
            })
            .catch(error => {
                alert(error)
            });
    }

    return (
        <div>

            <h4>Hosts: Connect </h4>
            <Divider />
            <table className="bp3-html-table bp3-html-table-bordered bp3-html-table-striped">
                <thead>
                    <tr>
                        <th>IP</th>
                        <th>Action</th>
                    </tr>
                </thead>
                {setRows()}
            </table>
        </div>
    )
}
