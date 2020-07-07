package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"
)

//TODO: refactor

type request struct {
	Notebook   notebook `json:"notebook"`
	Parameters []string `json:"parameters"`

	port string
}

type notebook struct {
	Cells []cells `json:"cells"`
}

type cells struct {
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

//TODO: only support python
func (r *request) setParams(params map[string]string) {
	for k, v := range params {
		r.Parameters = append(r.Parameters, k+"="+v)
	}
}

//TODO: add ping for API
func (r *request) run(path string) {
	fmt.Println("run: ", path)
	//notebook
	read(path, r)
	byteArray, err := json.Marshal(*r)
	if err != nil {
		panic(err)
	}

	//Wait for API is ready
	for i := 0; i < 30; i++ {
		response, err := http.Post("http://localhost:"+r.port+"/api/v1/job", "application/json", bytes.NewReader(byteArray))
		if err == nil {
			fmt.Println(r.port, response.StatusCode)
			break
		} else {
			fmt.Println(r.port, "Wait for API is ready.")
		}
		time.Sleep(1 * time.Second)
	}
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
