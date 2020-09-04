package main

import (
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	log "github.com/sirupsen/logrus"
)

var db *gorm.DB
var p string

/*
TODOs:
- Add flag for dev
- test 8000
- test multiple remote
*/
func main() {
	Worker := flag.Bool("worker", false, "Start remote worker")
	Port := flag.String("p", "22", "Set SSH port")
	DB := flag.Bool("db", false, "Remove db")
	Debug := flag.Bool("debug", false, "debug")
	flag.Parse()
	p = *Port

	if *Debug {
		path, err := exec.LookPath("jupyter")
		if err != nil {
			log.Error(err)
		}
		ioutil.WriteFile("log", []byte(path), 0644)
		fmt.Print(path)
	}

	if *DB {
		os.Remove("flow.db")
	}

	initDB()
	go flowWatcher()
	r := server()

	if *Worker {
		go runJupyter()
		log.Info("Bayesnote flow worker started")
		r.Run(":9000")
	} else {
		go tunnelWatcher()

		log.Info("Bayesnote flow core started")

		// go serveFrontend()
		r.Run(":9000")
	}
}

//TODO: check if jupyter is already running
func runJupyter() {
	path, err := lookJupyter()
	if err != nil {
		return
	}

	cmd := exec.Command("/bin/sh", "-c", path+" notebook --ip='127.0.0.1' --port='8888' --NotebookApp.token='' --NotebookApp.password='' --allow-root")
	err = cmd.Run()
	if err != nil {
		log.Error(err)
	}
}

//TODO: search all possible paths or let user input
func lookJupyter() (string, error) {
	dir, err := os.UserHomeDir()
	if err != nil {
		log.Error(err)
	}

	condaPath := filepath.Join(dir, "conda3/bin")
	minicondaPath := filepath.Join(dir, "miniconda3/bin")

	_, err = os.Stat(condaPath)
	if !os.IsNotExist(err) {
		os.Setenv("PATH", condaPath+":$PATH")
	}

	_, err = os.Stat(minicondaPath)
	if !os.IsNotExist(err) {
		os.Setenv("PATH", minicondaPath+":$PATH")
	}

	path, err := exec.LookPath("jupyter") //TODO: not executable by current user
	if err != nil {
		log.Error(err)
	}

	if path != "" {
		ioutil.WriteFile("flow.env", []byte(path), 0644)
		return path, nil
	}

	log.Error("Jupyter not found in $PATH")

	return "", errors.New("Jupyter not found")
}
