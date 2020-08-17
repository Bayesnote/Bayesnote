#!/bin/bash

cd ~/Bayesnote/packages/browser && serve -s build -n &
cd ~/Bayesnote/packages/node && yarn run dev &
cd ~/Bayesnote/flow && go run . &
sudo service docker start 