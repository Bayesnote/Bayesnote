fe:
	cd frontend && yarn build

linux:
	CC=x86_64-linux-musl-gcc CXX=x86_64-linux-musl-g++ GOARCH=amd64 GOOS=linux CGO_ENABLED=1 go build -ldflags "-linkmode external -extldflags -static" -o bayesnote_linux_amd64 && rice append -i . --exec bayesnote_linux_amd64

windows:
	CGO_ENABLED=1 CC=x86_64-w64-mingw32-gcc CXX=x86_64-w64-mingw32-g++ GOOS=windows GOARCH=amd64 go build -x -v -ldflags "-s -w" -o bayesnote_windows_amd64.exe && rice append -i . --exec bayesnote_windows_amd64.exe

mac:
	go build -o bayesnote_mac && rice append -i . --exec bayesnote_mac

clean:
	rm -f bayesnote_windows_amd64.exe bayesnote_linux_amd64 bayesnote_mac

build: clean fe linux windows mac
