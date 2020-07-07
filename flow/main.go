package main

import (
	"github.com/robfig/cron/v3"
)

var ct *cron.Cron
var dk docker

func main() {
	startFlowServer()
}
