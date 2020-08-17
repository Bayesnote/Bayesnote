package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

//TODO: refactor all requests
type target struct {
	User     string `yaml:"user"`
	IP       string `yaml:"ip"`
	Port     string `yaml:"port"`
	Password string `yaml:"password"`
	Pem      string `yaml:"pem"`

	client     *ssh.Client
	remotePath string
}

//TODO: restart kernel?
func (t *target) setRemoteSpark() {
	var c SparkConfig
	path := filepath.Join(homePath, ".sparkmagic", "config.json")
	url := "http://" + t.IP + ":8998"

	read(path, &c)
	c.KernelPythonCredentials.URL = url
	c.KernelRCredentials.URL = url
	c.KernelScalaCredentials.URL = url
	write(path, &c)
}

/*
Deploy process:
local:
- commit
- save

- check if SSH OK
- check pem file permission
- check if all ports are avaliable from local

remote:
- copy flow to remote host

- check if ./bayesnote created

- check if docker installed
- check if docker running
- check if permissions to execute docker

- copy image to remote host

- docker: load (rc)
- docker: start container

- write remote to disk
*/
func (t *target) deploy(f *flow) {
	config := t.newClientPemConfig()
	t.dial(config)
	t.initRemote()
	t.copyNotebook(*f)
	t.deployFlow()
	t.checkDocker()

	//ID := dk.commit(dk.getID())
	ID := "sha256:bf756fb1ae65adf866bd8c456593cd24beb6a0a061dedf42b26a993176745f6b"
	r := dk.save(ID)
	t.copyFileReader(r, filepath.Join(t.remotePath, ID))

	t.loadImage(ID)
	f.Image = ID
	t.runRemoteFlow(*f)
	//t.persist()
}

func (t *target) initRemote() {
	t.getRemoteHomeDir()
	t.createDir()
}

//TODO: what if requires user input
func (t *target) deployFlow() {
	//This deploys flow in .
	fileName := "noteflow"
	srcPath := filepath.Join(".", fileName)
	destPath := filepath.Join(t.remotePath, fileName)

	t.runCommand("sudo rm " + destPath)
	t.copyFile(srcPath, destPath)
	t.runCommand("sudo chmod 777 " + destPath)
	t.runCommand("sudo " + destPath)

	t.checkPorts()
}

//TODO: test
func (t *target) copyNotebook(f flow) {
	for _, v := range f.Tasks {
		srcPath := filepath.Join(hostPath, v.Name+".json")
		dstPath := filepath.Join(t.remotePath, v.Name+".json")
		t.copyFile(srcPath, dstPath)
	}
}

func (t *target) checkDocker() {
	if !t.isDockerOK() {
		log.Error("Docker is not ready.")
	} else {
		log.Info("Docker OK")
	}
}

//TODO: test
func (t *target) persist() {
	path := hostPath + "/remote"
	var ts []target
	read(path, &ts)
	ts = append(ts, *t)
	write(path, ts)
}

//TODO: dups
//Post from local to remote
func (t *target) runRemoteFlow(f flow) {
	urlPrefix := "http://" + t.IP + ":9292"
	body, err := json.Marshal(f)
	if err != nil {
		log.Error(err)
	}

	response, err := http.Post(urlPrefix+"/workflow/"+f.Name+"/run", "", bytes.NewReader(body))
	if err != nil {
		log.Error("The HTTP request failed with error %s\n", err)
	}

	data, _ := ioutil.ReadAll(response.Body)
	log.Info(string(data))
}

func (t *target) loadImage(ID string) {
	urlPrefix := "http://" + t.IP + ":9292"
	response, err := http.Post(urlPrefix+"/images/"+ID+"/load", "", nil)
	if err != nil {
		log.Error("The HTTP request failed with error %s\n", err)
	}
	data, _ := ioutil.ReadAll(response.Body)
	log.Info(string(data))
}

func (t *target) startImage(ID string) string {
	urlPrefix := "http://" + t.IP + ":9292"
	response, err := http.Post(urlPrefix+"/images/"+ID+"/start", "", nil)
	if err != nil {
		log.Error("The HTTP request failed with error %s\n", err)
	}
	data, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Error(err)
	}

	log.Info(string(data))
	s := strings.Split(string(data), ":")
	return s[len(s)-1]
}

//TODO: change to log
func (t *target) checkPorts() {
	ports := []string{"9292"}

	for _, port := range ports {
		timeout := time.Second
		conn, err := net.DialTimeout("tcp", net.JoinHostPort(t.IP, port), timeout)
		if err != nil {
			log.Error("CheckPorts failed:", err)
		} else {
			defer conn.Close()
			log.Info("Opened", net.JoinHostPort(t.IP, port))
		}
	}
}

func (t *target) isDockerOK() bool {
	response, err := http.Get("http://" + t.IP + ":9292/docker")
	if err != nil {
		log.Error("The HTTP request failed with error %s\n", err)
	}
	data, _ := ioutil.ReadAll(response.Body)
	if strings.Contains(string(data), "NOT") {
		return false

	}
	return true
}

func (t *target) createDir() {
	_, err := t.runCommand("mkdir -p .bayesnote")
	if err != nil {
		log.Error(err)
	}
}

//TODO: check if port 22 open
//TODO: report progress
//TODO: retry
func (t *target) dial(config *ssh.ClientConfig) {
	var err error
	t.client, err = ssh.Dial("tcp", t.IP+":"+t.Port, config)
	if err != nil {
		//TODO: should notify user rather than write into log
		log.Error(err, t.IP, t.Port, config.Config)
	} else {
		log.Info("SSH connected: ", t.IP)
	}
}

func (t *target) newClientPemConfig() *ssh.ClientConfig {
	pemBytes, err := ioutil.ReadFile(t.Pem)
	if err != nil {
		fmt.Printf("%+v", t)
		log.Fatal(err)
	}
	signer, err := ssh.ParsePrivateKey(pemBytes)
	if err != nil {
		log.Fatalf("parse key failed:%v", err)
	}

	config := &ssh.ClientConfig{
		User: t.User,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	log.Info("SSH pem config generated")
	return config
}

func (t *target) newClientPasswordConfig() *ssh.ClientConfig {
	config := &ssh.ClientConfig{
		User: t.User,
		Auth: []ssh.AuthMethod{
			ssh.Password(t.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	return config
}

func (t *target) getRemoteHomeDir() {
	homeDir, err := t.runCommand("eval echo ~$USER")
	if err != nil {
		log.Error(err)
	}
	t.remotePath = filepath.Join(homeDir, ".bayesnote")
}

//TODO: remove existing file
func (t *target) copyFile(srcPath string, dstPath string) {
	dstFile := t.createDstFile(dstPath)

	srcFile, err := os.Open(srcPath)
	if err != nil {
		log.Error(err, srcPath)
	}

	bytes, err := dstFile.ReadFrom(srcFile)
	if err != nil {
		log.Error(err, srcPath, dstPath)
	}

	dstFile.Close()
	log.Info("Copy file to remote: ", bytes)
}

func (t *target) copyFileReader(reader io.Reader, dstPath string) {
	dstFile := t.createDstFile(dstPath)

	_, err := dstFile.ReadFrom(reader)
	if err != nil {
		log.Fatal(err)
	}

	dstFile.Close()
	log.Info("Docker image copied")
}

func (t *target) createDstFile(dstPath string) *sftp.File {
	sftp, err := sftp.NewClient(t.client)
	if err != nil {
		log.Error(err)
	}

	dstFile, err := sftp.Create(dstPath)
	if err != nil {
		log.Error(err, dstPath)
	}

	return dstFile
}

func (t *target) runCommand(cmd string) (string, error) {
	session, err := t.client.NewSession()
	if err != nil {
		log.Error(err)
	}
	defer session.Close()

	var b bytes.Buffer
	session.Stdout = &b

	err = session.Start(cmd)
	if err != nil {
		log.Error("Failed to run command: ", cmd, session.Stderr)
	}
	log.Info("Run command: ", cmd)

	return strings.TrimSuffix(b.String(), "\n"), err
}

type SparkConfig struct {
	KernelPythonCredentials struct {
		Username string `json:"username"`
		Password string `json:"password"`
		URL      string `json:"url"`
		Auth     string `json:"auth"`
	} `json:"kernel_python_credentials"`
	KernelScalaCredentials struct {
		Username string `json:"username"`
		Password string `json:"password"`
		URL      string `json:"url"`
		Auth     string `json:"auth"`
	} `json:"kernel_scala_credentials"`
	KernelRCredentials struct {
		Username string `json:"username"`
		Password string `json:"password"`
		URL      string `json:"url"`
	} `json:"kernel_r_credentials"`
	LoggingConfig struct {
		Version    int `json:"version"`
		Formatters struct {
			MagicsFormatter struct {
				Format  string `json:"format"`
				Datefmt string `json:"datefmt"`
			} `json:"magicsFormatter"`
		} `json:"formatters"`
		Handlers struct {
			MagicsHandler struct {
				Class     string `json:"class"`
				Formatter string `json:"formatter"`
				HomePath  string `json:"home_path"`
			} `json:"magicsHandler"`
		} `json:"handlers"`
		Loggers struct {
			MagicsLogger struct {
				Handlers  []string `json:"handlers"`
				Level     string   `json:"level"`
				Propagate int      `json:"propagate"`
			} `json:"magicsLogger"`
		} `json:"loggers"`
	} `json:"logging_config"`
	WaitForIdleTimeoutSeconds        int    `json:"wait_for_idle_timeout_seconds"`
	LivySessionStartupTimeoutSeconds int    `json:"livy_session_startup_timeout_seconds"`
	FatalErrorSuggestion             string `json:"fatal_error_suggestion"`
	IgnoreSslErrors                  bool   `json:"ignore_ssl_errors"`
	SessionConfigs                   struct {
		DriverMemory  string `json:"driverMemory"`
		ExecutorCores int    `json:"executorCores"`
	} `json:"session_configs"`
	UseAutoViz                        bool   `json:"use_auto_viz"`
	CoerceDataframe                   bool   `json:"coerce_dataframe"`
	MaxResultsSQL                     int    `json:"max_results_sql"`
	PysparkDataframeEncoding          string `json:"pyspark_dataframe_encoding"`
	HeartbeatRefreshSeconds           int    `json:"heartbeat_refresh_seconds"`
	LivyServerHeartbeatTimeoutSeconds int    `json:"livy_server_heartbeat_timeout_seconds"`
	HeartbeatRetrySeconds             int    `json:"heartbeat_retry_seconds"`
	ServerExtensionDefaultKernelName  string `json:"server_extension_default_kernel_name"`
	CustomHeaders                     struct {
	} `json:"custom_headers"`
	RetryPolicy                       string    `json:"retry_policy"`
	RetrySecondsToSleepList           []float64 `json:"retry_seconds_to_sleep_list"`
	ConfigurableRetryPolicyMaxRetries int       `json:"configurable_retry_policy_max_retries"`
}
