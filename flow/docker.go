package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"

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
		panic(err)
	}
	return cli, ctx
}

func (d *docker) listImage() []types.ImageSummary {
	cli, ctx := d.getClient()
	rst, err := cli.ImageList(ctx, types.ImageListOptions{})
	if err != nil {
		panic(err)
	}
	return rst
}

func (d *docker) listContainer() []types.Container {
	cli, ctx := d.getClient()
	rst, err := cli.ContainerList(ctx, types.ContainerListOptions{})
	if err != nil {
		panic(err)
	}
	return rst
}

func (d *docker) commitContainer(ID string) string {
	cli, ctx := d.getClient()
	resp, err := cli.ContainerCommit(ctx, ID, types.ContainerCommitOptions{})
	if err != nil {
		panic(err)
	}
	return resp.ID
}

func (d *docker) pullImage(image string) {
	cli, ctx := d.getClient()
	reader, err := cli.ImagePull(ctx, image, types.ImagePullOptions{})
	if err != nil {
		panic(err)
	}
	io.Copy(os.Stdout, reader)
}

//Build image from Dockerfile
func (d *docker) buildImage() {
	cli, ctx := d.getClient()
	buildCtx, err := archive.TarWithOptions(d.dockerFile, &archive.TarOptions{})
	if err != nil {
		panic(err)
	}
	resp, err := cli.ImageBuild(ctx, buildCtx, types.ImageBuildOptions{Tags: []string{d.tag}})
	if err != nil {
		panic(err)
	}
	io.Copy(os.Stdout, resp.Body)
}

func (d *docker) tagImage(source string, dest string) {
	cli, ctx := d.getClient()
	err := cli.ImageTag(ctx, source, dest)
	if err != nil {
		panic(err)
	}
}

//create & start
func (d *docker) start(image string) (string, string) {
	cli, ctx := d.getClient()

	p, err := getFreePort()
	if err != nil {
		log.Panic(err)
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
				Type: mount.TypeBind,
				// TODO
				Source: "/Users/pt/Downloads/notebook",
				Target: "/home/jovyan/notebook",
			},
		},
	}
	resp, err := cli.ContainerCreate(ctx, containerConfig, hostConfig, nil, "")
	if err != nil {
		panic(err)
	}
	if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		panic(err)
	}

	//Wait for container to runnning
	for {
		rst, err := cli.ContainerInspect(ctx, resp.ID)
		if err != nil {
			panic(err)
		}
		if rst.State.Running == true {
			break
		}
	}

	// url := "0.0.0.0:" + string(ps)
	log.Print("Container started: ", resp.ID)
	return resp.ID, ps
}

func (d *docker) stop(ID string) {
	cli, ctx := d.getClient()
	rst, err := cli.ContainerInspect(ctx, ID)
	if err != nil {
		panic(err)
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
		log.Panic(err)
	}
	resp, err := cli.ContainerExecAttach(ctx, IDResp.ID, config)
	if err != nil {
		log.Panic(err)
	}

	return resp.Reader
}

//TODO: Add repo + TAG. Rename latest
func (d *docker) commit(ID string) {
	cli, ctx := d.getClient()
	commitResp, err := cli.ContainerCommit(ctx, ID, types.ContainerCommitOptions{})
	if err != nil {
		panic(err)
	}
	fmt.Println(commitResp.ID)
}
