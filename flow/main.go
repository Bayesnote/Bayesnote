package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Sirupsen/logrus"
	"github.com/robfig/cron/v3"
)

var ct *cron.Cron
var dk docker
var log = logrus.New()
var hostPath string
var homePath string
var containerPath string

func main() {
	initPath()
	initLogger()
	//	go startFlowServer()
	TestFlow()
}

//TODO make sparkmagic
func initPath() {
	var err error
	homePath, err = os.UserHomeDir()
	if err != nil {
		log.Error(err)
	}

	hostPath = filepath.Join(homePath, ".bayesnote")

	err = os.MkdirAll(hostPath, 0777)
	if err != nil {
		log.Error(err)
	}
	containerPath = "/home/jovyan/.bayesnote"
}

func initLogger() {
	log.Formatter = new(logrus.JSONFormatter)
	// path := filepath.Join(hostPath, "flow.log")
	// file, err := os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
	// if err != nil {
	// 	log.Error("Failed to log to file, using default stderr")
	// }
	log.Out = os.Stdout
}

//Test
func TestFlow() {
	var f flow
	read("test.yaml", &f)
	fmt.Printf("+%v", f)

	startDAG(f)
}
