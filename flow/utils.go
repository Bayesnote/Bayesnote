package main

import (
	"encoding/json"
	"io/ioutil"
	"net"
	"os"
	"strings"

	"gopkg.in/yaml.v2"
)

//open readall read
func read(path string, target interface{}) {
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0666)
	if err != nil {
		log.Panic(err)
	}

	fByte, err := ioutil.ReadAll(f)
	if err != nil {
		log.Panic(err)
	}

	if strings.Contains(path, "yaml") {
		yaml.Unmarshal(fByte, target)
		return
	}
	err = json.Unmarshal(fByte, target)
	if err != nil {
		log.Panic(err)
	}
}

//marshall + writefile
func write(path string, target interface{}) {
	jsonByte, err := json.Marshal(target)
	if err != nil {
		log.Print(err)
	}

	err = ioutil.WriteFile(path, jsonByte, 0666)
	if err != nil {
		log.Print(err)
	}
}

func del(slice []string, n string) []string {
	if len(slice) <= 1 {
		return []string{}
	}
	for idx, s := range slice {
		if n == s {
			slice[idx] = slice[len(slice)-1]
			break
		}
	}
	return slice[:len(slice)-1]
}

func getFreePort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}

	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

type pipPackage struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}
