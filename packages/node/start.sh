#!/bin/bash

python /opt/conda/lib/node_modules/@bayesnote/node/main.py &
cd /opt/conda/lib/node_modules/@bayesnote/browser && serve -s build