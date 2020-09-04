package main

import (
	"time"

	"github.com/robfig/cron/v3"
	"github.com/sirupsen/logrus"
	log "github.com/sirupsen/logrus"
)

func tunnelWatcher() {
	//delete all tunnels
	var ts []Tunnel
	db.Delete(&ts)

	//set up core + jupyter tunnel
	go watchServerTunnel()

	forward()
}

//TODO: add all existing flows to cron when restarted
func flowWatcher() {
	var fs []Flow
	db.Not("status = ?", "STOPPED").Find(&fs)
	db.Model(&fs).Update("status", "")
	c := cron.New()
	c.Start()

	for {
		addFlow(c)
		stopFlow(c)
		time.Sleep(time.Second)
	}
}

func addFlow(c *cron.Cron) {
	var f Flow
	if db.Find(&f, "status = ?", "").RecordNotFound() {
		return
	}
	log.WithFields(logrus.Fields{
		"flow": f.FlowName,
	}).Info("Get new flow")

	cID, err := c.AddFunc(f.Schedule, func() { f.run() })
	if err != nil {
		log.Error(err)
		db.Model(&f).Updates(Flow{Status: "FAILED", CronID: int(cID)})
		return
	}

	db.Model(&f).Updates(Flow{Status: "STARTED", CronID: int(cID)})

	log.WithFields(logrus.Fields{
		"schedule": f.Schedule,
	}).Info("Add cron job")

}

func stopFlow(c *cron.Cron) {
	var f Flow
	if db.Find(&f, "status = ?", "STOP").RecordNotFound() {
		return
	}

	c.Remove(cron.EntryID(f.CronID))

	db.Model(&f).Update("status", "STOPPED")

	log.WithFields(logrus.Fields{
		"flow": f.FlowName,
	}).Info("Stop flow")
}

func watchServerTunnel() {
	for {
		time.Sleep(time.Second)

		var hs []Host
		if db.Find(&hs).RecordNotFound() {
			continue
		}

		for _, h := range hs {
			var t Tunnel
			if db.Where("host_id = ? and type = ?", h.ID, "server").Find(&t).RecordNotFound() {
				newTunnel(h, "server")
			}
		}
	}
}

//TODO: called by server to add Jupyter. Core fixed. Jupyter flexible
func newTunnel(h Host, param string) {
	var localAddr string
	var RemoteAddr string

	switch param {
	// case "dev":
	// 	localAddr = "127.0.0.1:8000"
	// 	RemoteAddr = "127.0.0.1:9000"
	case "notebook":
		RemoteAddr = "127.0.0.1:8888"
	case "server":
		RemoteAddr = "127.0.0.1:9000"
	}

	localAddr = "127.0.0.1:" + getFreePort()

	t := Tunnel{
		HostID:     h.ID,
		ServerAddr: h.IP + ":" + p,
		LocalAddr:  localAddr,
		RemoteAddr: RemoteAddr,
		Type:       param,
	}
	db.Save(&t)
}

//TODO: check if remote running
//TODO: add status update check heartbeat for remote
//TODO: it does not pick up tunnel
func forward() {
	for {
		time.Sleep(time.Second)
		var t Tunnel
		if db.First(&t, "forwarded = ?", false).RecordNotFound() {
			continue
		}
		go t.forward()

		// if t.LocalAddr != "127.0.0.1:8000" {

		// }

		if t.Type == "notebook" {
			go openBrowser(t.LocalAddr)

			log.WithFields(logrus.Fields{
				"IP": t.LocalAddr,
			}).Info("Open browser")
		}

		db.Model(&t).Update("forwarded", true)

		log.WithFields(logrus.Fields{
			"LocalAddr": t.LocalAddr,
		}).Info("Start forwarding")

	}
}
