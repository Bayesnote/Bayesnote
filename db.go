package main

import (
	"os"

	"github.com/jinzhu/gorm"
	log "github.com/sirupsen/logrus"
)

func initDB() {
	openDB()
	initialMigration()
	db = db.Set("gorm:auto_preload", true)
}

func openDB() {
	var err error
	db, err = gorm.Open("sqlite3", "flow.db")
	if err != nil {
		log.Error(err)
	}
	err = os.Chmod("flow.db", 0644)
	if err != nil {
		log.Error(err)
	}
}

func initialMigration() {
	db, err := gorm.Open("sqlite3", "flow.db")
	if err != nil {
		log.Error(err)
		log.Panic("failed to connect database")
	}

	db.AutoMigrate(&Flow{}, &Host{}, &Task{}, &dep{}, FlowRun{}, &TaskRun{}, &Tunnel{})
}
