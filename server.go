package main

import (
	"log"
	"net/http"
	"time"

	rice "github.com/GeertJohan/go.rice"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func server() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000", "http://localhost:5000", "http://localhost:8080"},
		AllowMethods: []string{"PUT", "GET", "POST", "DELETE"},
	}))
	//all
	r.GET("/ping", ping)

	//local only
	r.POST("/hosts", newHost)
	r.GET("/hosts", allHosts)
	r.POST("/hosts/:ip", newDeployment)
	r.POST("/notebooks/:ip", newNotebook)

	//core (= centralized db)
	r.POST("/flows", newFlow)
	r.DELETE("/flows/:name", deleteFLow)
	r.PUT("/flows/start/:name", startFlow)
	r.PUT("/flows/stop/:name", stopFLow)
	r.GET("/flows", getFlows)
	r.GET("/runs", getRuns)

	//tunnel
	r.GET("/tunnels", getTunnels)
	r.GET("/tunnels/:ip", getTunnelbyIP)

	return r
}

func serveFrontend() {
	appBox, err := rice.FindBox("./frontend/build")
	if err != nil {
		log.Fatal(err)
	}
	// Serve static files
	http.Handle("/static/", http.FileServer(appBox.HTTPBox()))
	// Serve SPA (Single Page Application)
	http.HandleFunc("/", serveAppHandler(appBox))

	log.Println("Server starting at port 8080...")

	go openBrowser("localhost:8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func serveAppHandler(app *rice.Box) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		indexFile, err := app.Open("index.html")
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		http.ServeContent(w, r, "index.html", time.Time{}, indexFile)
	}
}

//TODO: add type column
//TODO: fix dev
func getTunnelbyIP(c *gin.Context) {
	ip := c.Param("ip")
	var t Tunnel
	if db.Where("server_addr LIKE ? AND type = ?", "%"+ip+"%", "server").Find(&t).RecordNotFound() {
		c.JSON(http.StatusBadRequest, gin.H{"error": ip + " not found"})
		return
	}
	c.JSON(200, t)
}

func getTunnels(c *gin.Context) {
	var ts []Tunnel
	db.Find(&ts) //TODO: exclude notebook tunnels
	c.JSON(200, ts)
}

func allHosts(c *gin.Context) {
	var hs []Host
	db.Find(&hs)
	c.JSON(200, hs)
}

func ping(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "pong",
	})
}

func newHost(c *gin.Context) {
	var h Host
	err := c.BindJSON(&h)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = h.connect()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = db.Create(&h).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "New host created",
	})
}

func newDeployment(c *gin.Context) {
	ip := c.Param("ip")

	var h Host
	if db.First(&h, "ip = ?", ip).RecordNotFound() {
		c.JSON(http.StatusBadRequest, gin.H{"error": ip + " not found"})
		return
	}

	_, err := h.connect()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.deployBinary()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "Installation OK",
	})
}

func newNotebook(c *gin.Context) {
	ip := c.Param("ip")

	var h Host
	if db.First(&h, "ip = ?", ip).RecordNotFound() {
		c.JSON(http.StatusBadRequest, gin.H{"error": ip + " not found"})
		return
	}

	newTunnel(h, "notebook")

	c.JSON(200, gin.H{
		"message": "Open new notebook OK",
	})
}

func newFlow(c *gin.Context) {
	var f Flow
	err := c.BindJSON(&f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = db.Create(&f).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "OK",
	})
}

func deleteFLow(c *gin.Context) {
	name := c.Param("name")
	var f Flow

	//stop first
	err := db.Model(&f).Where("flow_name = ?", name).Update("Status", "STOP").Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	//TODO: wait for stopped
	time.Sleep(2 * time.Second)
	err = db.Where("flow_name = ?", name).Unscoped().Delete(&f).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "OK",
	})
}

func startFlow(c *gin.Context) {
	name := c.Param("name")
	var f Flow
	db.Model(&f).Where("flow_name = ?", name).Update("status", "")
	c.JSON(200, gin.H{
		"message": "OK",
	})
}

func stopFLow(c *gin.Context) {
	name := c.Param("name")
	var f Flow
	err := db.Model(&f).Where("flow_name = ?", name).Update("Status", "STOP").Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "OK",
	})
}

func getFlows(c *gin.Context) {
	var fs []Flow
	db.Find(&fs)
	c.JSON(http.StatusOK, fs)
}

func getRuns(c *gin.Context) {
	var runs []FlowRun
	db.Find(&runs)
	c.JSON(http.StatusOK, runs)
}
