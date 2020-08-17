import React, { useCallback } from "react";
import { useDropzone } from 'react-dropzone';

interface Props {
    url: string
}
//TODO: Install packages from pip, conda, maven
export const Libraries: React.FC = () => {

    return <div>
        <DropZone />
    </div>
}

//TODO: move to directory or send to remote server
const DropZone: React.FC = () => {
    const onDrop = useCallback(acceptedFiles => {
        acceptedFiles.forEach((file: File) => {
            var formData = new FormData();
            formData.append('file', file);

            fetch('http://localhost:9292/upload', {
                method: 'POST',
                body: formData
            })
        })
    }, [])
    const { acceptedFiles, getRootProps, getInputProps } = useDropzone({ onDrop });
    //TODO: list files in ~/.bayesnote
    const files = acceptedFiles.map(file => (
        <li key={file.name}>
            {file.name} - {file.size} bytes
        </li>
    ));

    return (
        <section className="container">
            <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop, or click to upload files to the container</p>
            </div>
            <aside>
                <h4>Files</h4>
                <ul>{files}</ul>
            </aside>
        </section>
    );
}

/*
interface pipPackages {
    name: string
    version: string
}

pip:

 const [pipPackages, setPipPackages] = useState([] as pipPackages[])

    //url example: http://localhost:9292/containers/406fe37f4397bbb89523f40c5a5108d5e5fbb5541cef098b85b0665384866512/pip
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
        <ul style={{ listStyleType: "none", fontSize: '12px' }}>{listItems}</ul>
    </div>
*/