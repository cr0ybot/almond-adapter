#!/bin/bash

# This script is meant to run on the RPi to restart Things Gateway in debug mode

function restart {
	echo "#### Debug mode ended"

	echo "#### Restarting gateway..."
	sudo systemctl start mozilla-iot-gateway
}

trap restart EXIT;

. ~/.nvm/nvm.sh

echo "#### Stopping gateway..."
sudo systemctl stop mozilla-iot-gateway

sleep 5

echo "#### Starting gateway in debug mode..."
cd ~/mozilla-iot/gateway
npm start -- -d
