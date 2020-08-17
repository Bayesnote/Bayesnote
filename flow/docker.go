package main

import (
	"bufio"
	"bytes"
	"context"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/Sirupsen/logrus"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/archive"
	"github.com/docker/go-connections/nat"
)

type docker struct {
	dockerFile string
	tag        string
}

func (d *docker) getClient() (*client.Client, context.Context) {
	ctx := context.Background()
	cli, err := client.NewEnvClient()
	if err != nil {
		log.Error(err)
	}
	return cli, ctx
}

func (d *docker) listImage() []types.ImageSummary {
	cli, ctx := d.getClient()
	rst, err := cli.ImageList(ctx, types.ImageListOptions{})
	if err != nil {
		log.Error(err)
	}
	return rst
}

func (d *docker) listContainer() []types.Container {
	cli, ctx := d.getClient()
	rst, err := cli.ContainerList(ctx, types.ContainerListOptions{})
	if err != nil {
		log.Error(err)
	}
	return rst
}

func (d *docker) commitContainer(ID string) string {
	cli, ctx := d.getClient()
	resp, err := cli.ContainerCommit(ctx, ID, types.ContainerCommitOptions{})
	if err != nil {
		log.Error(err)
	}
	return resp.ID
}

func (d *docker) pullImage(image string) {
	cli, ctx := d.getClient()
	reader, err := cli.ImagePull(ctx, image, types.ImagePullOptions{})
	if err != nil {
		log.Error(err)
	}
	io.Copy(os.Stdout, reader)
}

func (d *docker) buildImage() {
	cli, ctx := d.getClient()
	buildCtx, err := archive.TarWithOptions(d.dockerFile, &archive.TarOptions{})
	if err != nil {
		log.Error(err)
	}
	resp, err := cli.ImageBuild(ctx, buildCtx, types.ImageBuildOptions{Tags: []string{d.tag}})
	if err != nil {
		log.Error(err)
	}
	io.Copy(os.Stdout, resp.Body)
}

func (d *docker) tagImage(source string, dest string) {
	cli, ctx := d.getClient()
	err := cli.ImageTag(ctx, source, dest)
	if err != nil {
		log.Error(err)
	}
}

func (d *docker) start(image string) (string, string) {
	cli, ctx := d.getClient()

	p, err := getFreePort()
	if err != nil {
		log.Error(err)
	}
	ps := strconv.Itoa(p)

	log.Print("Free port allocated: ", ps)

	containerConfig := &container.Config{
		Image: image,
		ExposedPorts: nat.PortSet{
			"8889/tcp": struct{}{},
		},
	}
	hostConfig := &container.HostConfig{
		PortBindings: nat.PortMap{
			"8889/tcp": []nat.PortBinding{
				{
					HostIP:   "0.0.0.0",
					HostPort: string(ps),
				},
			},
		},
		Mounts: []mount.Mount{
			{
				Type:   mount.TypeBind,
				Source: hostPath,
				Target: containerPath,
			},
		},
	}
	resp, err := cli.ContainerCreate(ctx, containerConfig, hostConfig, nil, "")
	if err != nil {
		log.Error(err)
	}
	if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		log.Error(err)
	}

	//Wait for container to runnning
	for {
		rst, err := cli.ContainerInspect(ctx, resp.ID)
		if err != nil {
			log.Error(err)
		}
		if rst.State.Running == true {
			break
		}
	}

	log.Print("Container started: ", resp.ID)
	return resp.ID, ps
}

func (d *docker) stop(ID string) {
	cli, ctx := d.getClient()
	rst, err := cli.ContainerInspect(ctx, ID)
	if err != nil {
		log.Error(err)
	}
	if rst.State.Running == true {
		err := cli.ContainerStop(ctx, ID, nil)
		if err != nil {
			log.Print(err)
		}
		log.Print("Container stopped: ", ID)
	}
}

func (d *docker) runCmd(cmd []string, ID string) *bufio.Reader {
	cli, ctx := d.getClient()

	config := types.ExecConfig{
		AttachStdin:  true,
		AttachStderr: true,
		AttachStdout: true,
		Cmd:          cmd,
		Tty:          true,
	}
	IDResp, err := cli.ContainerExecCreate(ctx, ID, config)
	if err != nil {
		log.Error(err)
	}
	resp, err := cli.ContainerExecAttach(ctx, IDResp.ID, config)
	if err != nil {
		log.Error(err)
	}

	return resp.Reader
}

//TODO: Add repo + TAG. Rename latest
func (d *docker) commit(ID string) string {
	cli, ctx := d.getClient()
	resp, err := cli.ContainerCommit(ctx, ID, types.ContainerCommitOptions{})
	if err != nil {
		log.Error(err)
	}

	s := strings.Split(resp.ID, ":")
	return s[1]
}

//TODO: add progress bar
func (d *docker) save(ID string) io.ReadCloser {
	cli, ctx := d.getClient()

	var IDs []string
	IDs = append(IDs, ID)

	reader, err := cli.ImageSave(ctx, IDs)
	if err != nil {
		log.Error(err)
	}

	return reader
}

func (d *docker) load(path string) {
	cli, ctx := d.getClient()
	file, err := os.Open(path)
	if err != nil {
		log.Error(err)
	}

	resp, err := cli.ImageLoad(ctx, file, false)
	if err != nil {
		log.Error(err)
	}

	log.WithFields(logrus.Fields{
		"resp": resp.JSON,
	}).Info("load image")
}

func (d *docker) copyFile(ID string, srcPath string) {
	cli, ctx := d.getClient()
	byteArray, err := ioutil.ReadFile(srcPath)
	if err != nil {
		log.Error(err)
	}
	err = cli.CopyToContainer(ctx, ID, containerPath, bytes.NewReader(byteArray), types.CopyToContainerOptions{AllowOverwriteDirWithFile: true})
	if err != nil {
		log.Error(err)
	}
}

//TODO: should only keep one container
func (d *docker) getID() string {
	cmd := exec.Command("hostname")
	if cmd.Stderr != nil {
		log.Error(cmd.Stderr)
	}

	output, err := cmd.Output()
	if err != nil {
		log.Error(err)
	}

	return strings.TrimSuffix(string(output), "\n")
}

func (d *docker) isRunning() bool {
	cli, ctx := d.getClient()
	_, err := cli.Ping(ctx)
	if err != nil {
		log.Error(err)
		return false
	}
	return true
}

func (d *docker) isInstalled() bool {
	cmd := exec.Command("bash", "-c", "which docker")
	if cmd.Stderr != nil {
		log.Error(cmd.Stderr)
	}

	output, err := cmd.Output()
	if err != nil {
		log.Error(err)
	}

	if strings.Contains(string(output), "not found") {
		return false
	}
	return true
}
