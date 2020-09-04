package main

import (
	"io/ioutil"
	"os"
	"os/exec"
	"time"

	"github.com/jinzhu/gorm"
	"github.com/sirupsen/logrus"
	log "github.com/sirupsen/logrus"
)

//TODO: validate flow
type Flow struct {
	gorm.Model
	FlowName string `gorm:"unique;not null"` //TODO: unique across two columns
	HostIP   string `gorm:"not null"`
	Schedule string `gorm:"not null"`
	Status   string //used by db
	CronID   int
	Tasks    []Task
}

type Task struct {
	gorm.Model
	FlowID   uint
	FlowName string `gorm:"not null"`
	Name     string `gorm:"not null"`
	Path     string `gorm:"not null"`
	Content  string
	Next     string `json:"Next"`
}

type dep struct {
	gorm.Model
	FlowRunID uint
	FlowName  string `gorm:"not null"`
	Parent    string `gorm:"not null"`
	Child     string `gorm:"not null"`
}

type FlowRun struct {
	gorm.Model
	FlowID   uint
	HostIP   string
	FlowName string
	Time     time.Time
	Status   string
	TaskRuns []TaskRun
}

type TaskRun struct {
	gorm.Model
	FlowRunID uint
	Name      string
	Path      string
	Status    string
	RunCnt    int
	Notebook  string
}

func (f *Flow) run() {
	done := make(chan struct{})

	//create flow run
	db.Create(&FlowRun{FlowID: f.ID, HostIP: f.HostIP, FlowName: f.FlowName, Time: time.Now(), Status: "READY"})
	log.Info("Flow run created")

	//get flow run
	var r FlowRun
	db.First(&r, "status = ?", "READY")

	//get tasks for flow run
	var tasks []Task
	db.Find(&tasks, "flow_id = ?", f.ID)
	r.setTasks(tasks) //Move this

	//start
	go r.start()
	go r.status(done)

	//exist
	<-done
}

// task -> taskrun
func (r *FlowRun) setTasks(tasks []Task) {
	for _, t := range tasks {
		tr := TaskRun{FlowRunID: r.ID, Name: t.Name, Path: t.Path, RunCnt: 2, Status: "READY"}
		db.Create(&tr)

		//generate dep
		if len(t.Next) > 0 {
			db.Create(&dep{FlowRunID: r.ID, FlowName: t.FlowName, Parent: t.Name, Child: t.Next})
		}
	}

	log.Info("Flow tasks set")
}

func (r *FlowRun) start() {
	db.Model(r).Update("Status", "RUNNING")
	log.Info("Flow running")

	var ts []TaskRun
	db.Find(&ts, "flow_run_id = ?", r.ID)

	for i := range ts {
		ts[i].start()
	}
}

func (r *FlowRun) status(done chan struct{}) {
out:
	for {
		var ts []TaskRun
		db.Find(&ts, "flow_run_id = ?", r.ID)

		for i := range ts {
			if ts[i].Status == "FAIL" {
				db.Model(r).Update("Status", "FAIL")
				log.Info("Flow run failed")
				break out
			}
		}

		if r.done() {
			db.Model(r).Update("Status", "OK")
			log.Info("Flow run OK")
			break
		}

		time.Sleep(time.Second)
	}

	log.Info("Flow run exist")

	done <- struct{}{}
}

func (r FlowRun) done() bool {
	var ts []TaskRun
	db.Find(&ts, "flow_run_id = ?", r.ID)

	for _, t := range ts {
		if t.Status == "READY" || t.Status == "RUNNING" {
			return false
		}
	}
	return true
}

func (t *TaskRun) start() {
	for {
		if t.checkParent() {
			t.run()
			break
		}
		time.Sleep(time.Second)
	}
}

func (t TaskRun) checkParent() bool {
	var deps []dep
	db.Find(&deps, "flow_run_id = ? and child = ?", t.FlowRunID, t.Name)
	if len(deps) == 0 {
		return true
	}
	return false
}

func (t *TaskRun) delParent() {
	var deps []dep
	db.Find(&deps, "flow_run_id = ? and parent = ?", t.FlowRunID, t.Name)
	db.Delete(&deps)
}

//TODO: refactor
func (t *TaskRun) run() {
	if t.RunCnt == 0 {
		t.Status = "FAIL"
		db.Model(t).Update("status", "FAIL")
		log.WithFields(logrus.Fields{
			"task": t.Name,
		}).Info("Task run failed")
		return
	}

	t.RunCnt--
	t.Status = "RUNNING"
	db.Model(t).Update("status", "RUNNING")

	out := "temp" + "-" + t.Name
	oPath := out + ".ipynb"
	//TODO: jupyter path
	cmd := exec.Command("jupyter", "nbconvert", "--to", "notebook",
		"--output", out, "--execute", t.Path, "--ExecutePreprocessor.timeout=3600")
	err := cmd.Run()
	if err != nil {
		log.Error(err)
		t.run()
		return
	}

	t.Status = "OK"

	cmd = exec.Command("jupyter", "nbconvert", oPath, "--to", "html")
	err = cmd.Run()
	if err != nil {
		log.Error(err)
		t.run()
		return
	}

	notebook, err := ioutil.ReadFile(out + ".html")
	if err != nil {
		log.Error(err)
	}

	if len(notebook) == 0 {
		log.Error("Notebook empty")
	}

	err = os.Remove(oPath)
	if err != nil {
		log.Error("Failed to remove temp notebook")
	}

	err = os.Remove(out + ".html")
	if err != nil {
		log.Error("Failed to remove temp notebook")
	}
	t.Notebook = string(notebook)

	db.Model(&t).Updates(TaskRun{Status: t.Status, Notebook: t.Notebook})
	if err != nil {
		log.Error(err)
	}

	t.delParent()

	log.WithFields(logrus.Fields{
		"task": t.Name,
	}).Info("Task run OK")
}
