package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"
)

//TODO: Refactor

type request struct {
	Notebook notebook
	port     string
}

type notebook struct {
	Cells []cell `json:"cells"`
	Name  string `json:"name"`
}

type cell struct {
	ID         string        `json:"id"`
	Type       string        `json:"type"`
	Source     string        `json:"source"`
	Language   string        `json:"language"`
	KernelName string        `json:"kernelName"`
	Backend    string        `json:"backend"`
	Metadata   metadata      `json:"metadata"`
	Outputs    []interface{} `json:"outputs"`
	State      int           `json:"state"`
}

type metadata struct {
	Scrollbar    bool `json:"scrollbar"`
	SourceHidden bool `json:"source_hidden"`
	OutputHidden bool `json:"output_hidden"`
}

type jobResponse struct {
	Data jobResponseData `json:"data"`
	Msg  string          `json:"msg"`
}

type jobResponseData struct {
	StatusCode int    `json:"statusCode"`
	StatusName string `json:"statusName"`
}

type items struct {
	Type        string `json:"type"`
	Required    string `json:"required"`
	Description string `json:"description"`
}

//TODO: replace with notebook
type runResp struct {
	Cells   []cell `json:"cells"`
	Success bool   `json:"success"`
}

//TODO: add ping for API
func (r *request) run(path string) bool {
	var n notebook
	read(path, &n)

	byteArray, err := json.Marshal(n)
	if err != nil {
		log.Error(err)
	}

	for i := 0; i < 10; i++ {
		if r.ping() == true {
			resp, err := http.Post("http://localhost:"+r.port+"/api/v1/job", "application/json", bytes.NewBuffer(byteArray))
			if err != nil {
				log.Error(err)
			}

			bodyBytes, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Error(err)
			}
			var runResp runResp
			json.Unmarshal(bodyBytes, &runResp)
			fmt.Printf("%+v\n", runResp)
			log.Info(runResp)

			if runResp.Success {
				return true
			}
		}
		time.Sleep(1 * time.Second)
	}
	return false
}

func (r *request) ping() bool {
	response, err := http.Get("http://localhost:" + r.port + "/api/v1/ping")
	if err != nil {
		log.Error(err)
		return false
	}

	if response.StatusCode == 200 {
		log.Info("Ping: 200")
		return true
	}

	return false
}

func (r *request) status() string {
	response, err := http.Get("http://localhost:" + r.port + "/api/v1/job")
	if err != nil {
		fmt.Printf("The HTTP request failed with error %s\n", err)
		return "failed"
	}

	body, _ := ioutil.ReadAll(response.Body)
	var jr jobResponse
	json.Unmarshal(body, &jr)
	return jr.Data.StatusName
	// write(path+"-run-"+time.Now().String()+".json", jr)
}
