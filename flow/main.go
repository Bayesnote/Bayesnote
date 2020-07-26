package main

import (
	"os"

	"github.com/Sirupsen/logrus"
	"github.com/robfig/cron/v3"
)

var ct *cron.Cron
var dk docker
var log = logrus.New()

func main() {
	initLogger()
	startFlowServer()
}

func initLogger() {
	// log.Formatter = new(logrus.JSONFormatter)
	file, err := os.OpenFile("flow.log", os.O_APPEND|os.O_WRONLY, 0666)
	if err == nil {
		log.Out = file
	} else {
		log.Info("Failed to log to file, using default stderr")
	}
}
