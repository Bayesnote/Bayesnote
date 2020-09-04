package main

import (
	"fmt"
	"os/exec"
	"runtime"
	"time"

	log "github.com/sirupsen/logrus"
)

func openBrowser(url string) {
	var err error

	time.Sleep(2 * time.Second)

	url = "http://" + url

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Run()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Run()
	case "darwin":
		err = exec.Command("open", url).Run()
	default:
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		log.Error(err)
	}
}
