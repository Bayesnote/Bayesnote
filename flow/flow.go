package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Sirupsen/logrus"
)

/*
TODO:
- check validation of input yaml
- check lifecycle of status of vertex
- global status for clean up
- remove stopped container
*/

//raw
type flow struct {
	Name     string `yaml:"name"`
	Target   target `yaml:"target"`
	Schedule string `yaml:"schedule"`
	Tasks    []task `yaml:"tasks"`
	Image    string `yaml:"image"`
}

type task struct {
	Name string `yaml:"name"`
	// Params map[string][]string `yaml:"params"`
	Next string `yaml:"next"`
}

//DAG processed
type DAG struct {
	Name     string
	Time     time.Time
	Vertices []vertex
	// Params   []params

	msgCh chan event
}

type vertex struct {
	Name       string
	Downstream []string
	Status     string

	retry    int
	next     string
	upstream []string
	params   map[string]string

	//container info
	image string
	id    string
	port  string
}

// type params struct {
// 	name  string
// 	index int
// 	value map[string]string
// }

type event struct {
	// eventName   string
	name        string
	status      string
	containerID string
}

// DAGRun off
type DAGRun struct {
	DAGs []DAG
}

func startDAG(f flow) {
	d := &DAG{Name: f.Name}
	d.setVertex(f)
	d.setEdges()
	d.start()

	log.WithFields(logrus.Fields{
		"name":     f.Name,
		"schedule": f.Schedule,
		"status":   "running",
	}).Info("Flow running")
}

func (d *DAG) start() {
	d.msgCh = make(chan event)
	//vertex listen
	go d.emit()
	//DAG listen
	go d.listen()
	//start from root
	d.msgCh <- event{}
	//notify vertex everything is done
	d.handleDone()
}

func (d *DAG) setVertex(f flow) {
	for _, t := range f.Tasks {
		v := vertex{Name: t.Name, next: t.Next}
		d.Vertices = append(d.Vertices, v)
	}
	d.setRetry()
	d.setImage(f.Image)
}

func (d *DAG) setEdges() {
	for i := range d.Vertices {
		v := d.Vertices[i]
		if v.next != "" {
			v.Downstream = append(v.Downstream, v.next)
			for j := range d.Vertices {
				if v.next == d.Vertices[j].Name {
					d.Vertices[j].upstream = append(d.Vertices[j].upstream, v.Name)
				}
			}
		}
	}

	log.WithFields(logrus.Fields{
		"DAG": fmt.Sprintf("%+v", d),
	}).Info("DAG generated")
}

//TODO: rename
func (d *DAG) emit() {
	for msg := range d.msgCh {
		for i := range d.Vertices {
			go d.Vertices[i].listen(msg, d.msgCh)
		}
	}
}

/* TODO:
read HTML & send email.
*/
func (d *DAG) handleDone() {
	for {
		time.Sleep(1 * time.Second)
		if d.isAllDone() == true {
			log.WithFields(logrus.Fields{
				"name":   d.Name,
				"status": "done",
			}).Info("Flow done")
			break
		}
	}
}

func (d *DAG) listen() {
	go d.getStopSignal()
	//msgChan forward msg while update status
	for msg := range d.msgCh {
		d.msgCh <- msg
	}
}

func (d *DAG) getStopSignal() {
	for {
		time.Sleep(1 * time.Second)
		if d.Name == os.Getenv("STOP") {
			//TODO: need stopChan ? or sender check if golang channel is closed?
			// d.stopAllcontainers()
			os.Setenv("STOP", "")
			close(d.msgCh)
			break
		}
	}
}

func (d *DAG) isAllDone() bool {
	//all retry == 0 => return true
	for _, v := range d.Vertices {
		if v.retry != 0 {
			break
		}
		return true
	}

	for _, v := range d.Vertices {
		if v.Status != "succeeded" {
			return false
		}
	}

	return true
}

func (d *DAG) setRetry() {
	for i := range d.Vertices {
		d.Vertices[i].retry = 3
	}
}

func (d *DAG) setImage(image string) {
	for i := range d.Vertices {
		d.Vertices[i].image = image
	}
}

//TODO: if v is OK -> close channel
func (v *vertex) handleEvent(e event, msgChan chan event) {
	log.Info("%s recv from %s \n", v.Name, e)

	if v.Name == e.name {
		v.Status = e.status
		switch en := e.status; en {
		case "succeeded":
			dk.stop(v.id)
		case "failed":
			//TODO: stop ?
			v.run(msgChan)
		}
	} else {
		switch en := e.status; en {
		case "succeeded":
			v.removeUpstream(e.name)
		}
	}
}

func (v *vertex) startContainer() {
	v.id, v.port = dk.start(v.image)

	log.WithFields(logrus.Fields{
		"name":      v.Name,
		"container": v.id,
		"port":      v.port,
	}).Info("Start container")
}

//TODO: stop everything ?
func (v *vertex) stop(msgChan chan event) {
	dk.stop(v.id)
	msgChan <- event{name: v.Name, status: "failed"}

	log.WithFields(logrus.Fields{
		"name": v.Name,
	}).Info("Run failed")
}

//listen on
func (v *vertex) listen(msg event, msgChan chan event) {
	v.handleEvent(msg, msgChan)
	v.run(msgChan)
}

func (v *vertex) run(msgChan chan event) {
	if v.retry == 0 {
		v.stop(msgChan)
	}
	//check if we can run this vertex
	if len(v.upstream) == 0 && v.Status != "succeeded" && v.Status != "running" && v.retry > 0 {
		v.startContainer()
		v.Status = "running"
		v.retry--
		go v.runNotebook(msgChan)

		log.WithFields(logrus.Fields{
			"name":   v.Name,
			"status": "running",
		}).Info("Run notebook")
	}
}

func (v *vertex) removeUpstream(up string) {
	if len(v.upstream) == 1 {
		var emptyupstream []string
		v.upstream = emptyupstream
		return
	}

	for i := 0; i < len(v.upstream); i++ {
		if v.upstream[i] == up {
			v.upstream = append(v.upstream[:i], v.upstream[i+1:]...)
			i--
		}
	}
}

//nb string, p map[string]string, port string, statusChan chan event
func (v *vertex) runNotebook(statusChan chan event) {
	log.Info("runNotebook: ", v.Name)
	//make request
	r := request{port: v.port, name: v.Name}
	path := filepath.Join(hostPath, v.Name+".json")

	success := r.run(path)
	rst := event{name: v.Name}

	if success {
		rst.status = "succeeded"
		statusChan <- rst

		log.WithFields(logrus.Fields{
			"name":   v.Name,
			"status": "succeeded",
		}).Info("Run notebook")
	}
}

//process log
type flowLog struct {
	Level    string    `json:"level"`
	Msg      string    `json:"msg"`
	Name     string    `json:"name"`
	Schedule string    `json:"schedule"`
	Status   string    `json:"status"`
	Time     time.Time `json:"time"`
}

type flowLogs []flowLog

//TODO: path
func (l *flowLogs) read() {
	f, err := ioutil.ReadFile("flow.log")
	if err != nil {
		log.Error("Fail to read flow.log")
	}
	//string -> JSON string
	fs := string(f)
	fs = "[" + strings.Replace(fs, "\n", ",", -1) + "]"
	i := strings.LastIndex(fs, ",")
	fs = fs[:i] + fs[i+1:]
	json.Unmarshal([]byte(fs), l)
}

//list the last status of all workflow without any dups
func (l *flowLogs) list() []byte {
	d := map[string]flowLog{}
	for _, v := range *l {
		if val, ok := d[v.Name]; ok {
			if v.Time.Sub(val.Time) > 0 {
				d[v.Name] = v
			}
		} else {
			d[v.Name] = v
		}
	}

	wf := []flowLog{}
	for _, v := range d {
		if len(v.Name) > 0 {
			wf = append(wf, v)
		}
	}

	jsonByte, err := json.Marshal(wf)
	if err != nil {
		log.Error("Failed to convert log to JSON byte")
	}

	return jsonByte
}
