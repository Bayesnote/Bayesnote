package main

import (
	"bufio"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Sirupsen/logrus"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/robfig/cron/v3"
	"github.com/rs/cors"
	"gopkg.in/yaml.v2"
)

//TODO:  for all handlers
func startFlowServer() {
	ct = cron.New()
	ct.Start()

	r := mux.NewRouter()

	//cluster
	r.HandleFunc("/clusters", handleSetCluster).Methods("POST")

	//file
	r.HandleFunc("/upload", handleUpload).Methods("POST")

	//workflow
	r.HandleFunc("/workflow", handleStatus).Methods("GET")
	r.HandleFunc("/workflow/{workflow}/deploy", handleDeploy).Methods("POST")
	r.HandleFunc("/workflow/{workflow}/run", handleRun).Methods("POST")
	r.HandleFunc("/workflow/{workflow}/stop", handleStop).Methods("POST")

	//docker
	r.HandleFunc("/docker", handleDocker).Methods("GET")

	//image
	r.HandleFunc("/images", handleGetImages).Methods("GET")
	r.HandleFunc("/images/{imageID}/load", handleLoadImage).Methods("POST")
	r.HandleFunc("/images/{image:.*}/start", handleStartImage).Methods("POST")

	//container
	r.HandleFunc("/containers", handleListContainers).Methods("GET")
	r.HandleFunc("/containers/{containerID}/update", handleUpdateContainer).Methods("POST")
	r.HandleFunc("/containers/{containerID}/stop", handleStopContainer).Methods("POST")

	//pip
	r.HandleFunc("/containers/{containerID}/pip", handleListPip).Methods("GET")
	//ws
	r.HandleFunc("/containers/{containerID}/pip/{package}/install", handleInstallPip)

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
	})

	//TODO: spark
	http.ListenAndServe(":9292", handlers.RecoveryHandler()(c.Handler(r)))
}

func handleDocker(w http.ResponseWriter, r *http.Request) {
	if dk.isInstalled() && dk.isRunning() {
		w.Write([]byte("Docker OK"))
	} else {
		w.Write([]byte("Dokcer is NOT OK"))
	}
}

func handleLoadImage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	imageID := vars["imageID"]
	path := filepath.Join(hostPath + imageID)
	dk.load(path)
	byteJSON, _ := json.Marshal("load: " + imageID)
	w.Write(byteJSON)
}

func handleSetCluster(w http.ResponseWriter, r *http.Request) {
	body, _ := ioutil.ReadAll(r.Body)
	var t target
	json.Unmarshal(body, &t)
	//TODO: does this require SSH connection ?
	t.setRemoteSpark()
}

//TODO: This should only be used for local -> remote communication. Data is mounted from host to local container
func handleUpload(w http.ResponseWriter, r *http.Request) {
	file, handler, err := r.FormFile("file")
	if err != nil {
		log.Error(err)
	}
	defer file.Close()

	fileBytes, err := ioutil.ReadAll(file)
	if err != nil {
		log.Error(err)
	}

	err = ioutil.WriteFile("/home/jovyan/.bayesnote/"+handler.Filename, fileBytes, 777)
	if err != nil {
		log.Error(err)
	}

	log.WithFields(logrus.Fields{
		"file": handler.Filename,
	}).Info("file uploaded")
}

//TODO: cross-origin issue
func handleStatus(w http.ResponseWriter, r *http.Request) {
	var f flowLogs
	f.read()
	w.Write(f.list())
}

//TODO: password
func handleDeploy(w http.ResponseWriter, r *http.Request) {
	body, _ := ioutil.ReadAll(r.Body)
	var f flow
	yaml.Unmarshal(body, &f)

	//TODO: this is ugly
	f.Target.deploy(&f)

	//TODO: poll data from remote ~/.bayesnote
	//log
	log.WithFields(logrus.Fields{
		"name":     f.Name,
		"schedule": f.Schedule,
		"status":   "scheduled",
	}).Info("Flow scheduled")
}

func handleRun(w http.ResponseWriter, r *http.Request) {
	body, _ := ioutil.ReadAll(r.Body)
	var f flow
	yaml.Unmarshal(body, &f)
	ct.AddFunc(f.Schedule, func() { startDAG(f) })
}

func handleStop(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	workflow := vars["workflow"]
	os.Setenv("STOP", workflow)
}

func handleGetImages(w http.ResponseWriter, r *http.Request) {
	byteJSON, _ := json.Marshal(dk.listImage())
	w.Write(byteJSON)
}

func handleStartImage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	image := vars["image"]
	_, port := dk.start(image)
	byteJSON, _ := json.Marshal("Start image with port: " + port)
	w.Write(byteJSON)
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
