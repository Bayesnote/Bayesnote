package main

import (
	"bufio"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/robfig/cron/v3"
	"gopkg.in/yaml.v2"
)

func startFlowServer() {
	ct = cron.New()
	ct.Start()

	r := mux.NewRouter()

	//workflow
	r.HandleFunc("/workflow/{workflow}", handleStatus).Methods("GET")
	r.HandleFunc("/workflow/{workflow}/start", handleStart).Methods("POST")
	r.HandleFunc("/workflow/{workflow}/run", handleRun).Methods("POST")
	r.HandleFunc("/workflow/{workflow}/stop", handleStop).Methods("POST")

	//image
	r.HandleFunc("/images", handleGetImages).Methods("GET")
	r.HandleFunc("/images/{image:.*}", handlePostImage).Methods("POST")

	//container
	r.HandleFunc("/containers", handleListContainers).Methods("GET")
	r.HandleFunc("/containers/{containerID}/update", handleUpdateContainer).Methods("POST")
	r.HandleFunc("/containers/{containerID}/stop", handleStopContainer).Methods("POST")

	//pip
	r.HandleFunc("/containers/{containerID}/pip", handleListPip).Methods("GET")
	//ws
	r.HandleFunc("/containers/{containerID}/pip/{package}/install", handleInstallPip)

	//TODO: spark
	http.ListenAndServe(":80", r)
}

func handleStart(w http.ResponseWriter, r *http.Request) {
	body, _ := ioutil.ReadAll(r.Body)
	var f flow
	yaml.Unmarshal(body, &f)
	//TODO:
	// ct.AddFunc(f.Schedule, func() { startDAG() })
}

func handleRun(w http.ResponseWriter, r *http.Request) {
	body, _ := ioutil.ReadAll(r.Body)
	var f flow
	yaml.Unmarshal(body, &f)
	// startDAG()
}

func handleStop(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	workflow := vars["workflow"]
	os.Setenv("STOP", workflow)
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	workflow := vars["workflow"]
	var run DAGRun
	read(workflow+"-log.json", &run)
	byteJSON, _ := json.Marshal(run)
	w.Write(byteJSON)
}

func handleGetImages(w http.ResponseWriter, r *http.Request) {
	byteJSON, _ := json.Marshal(dk.listImage())
	w.Write(byteJSON)
}

//TODO
func handlePostImage(w http.ResponseWriter, r *http.Request) {
	// vars := mux.Vars(r)
	// image := vars["image"]
	// byteJSON, _ := json.Marshal(dk.start(image))
	// w.Write(byteJSON)
}

func handleListContainers(w http.ResponseWriter, r *http.Request) {
	byteJSON, _ := json.Marshal(dk.listContainer())
	w.Write(byteJSON)
}

// TODO: should stop return status? where to log?
func handleStopContainer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	containerID := vars["containerID"]
	byteJSON, _ := json.Marshal("stopped: " + containerID)
	w.Write(byteJSON)
}

func handleUpdateContainer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	containerID := vars["containerID"]
	dk.commitContainer(containerID)
	byteJSON, _ := json.Marshal("committed: " + containerID)
	w.Write(byteJSON)
}

// TODO: remove 8 bytes
func handleListPip(w http.ResponseWriter, r *http.Request) {
	//TODO: Handle CORS issues
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")

	vars := mux.Vars(r)
	containerID := vars["containerID"]
	cmd := []string{"pip", "list", "--format", "json"}
	rst, _ := ioutil.ReadAll(dk.runCmd(cmd, containerID))

	var pipPackages []pipPackage
	err := json.Unmarshal(rst, &pipPackages)
	if err != nil {
		panic(err)
	}
	byteArray, err := json.Marshal(pipPackages)
	if err != nil {
		panic(err)
	}
	w.Write(byteArray)
}

func handleInstallPip(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		panic(err)
	}

	vars := mux.Vars(r)
	pipPak := vars["package"]
	containerID := vars["containerID"]
	cmd := []string{"pip", "install", pipPak}

	//stream
	reader := dk.runCmd(cmd, containerID)
	s := bufio.NewScanner(reader)
	go func() {
		for s.Scan() {
			if err := ws.WriteMessage(websocket.TextMessage, s.Bytes()); err != nil {
				break
			}
		}
	}()

}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}
