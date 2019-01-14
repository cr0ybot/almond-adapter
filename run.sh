#!/bin/bash

# This script uploads the addon to the local RPi Things Gateway for testing

USER="pi"
HOST="gateway.local"
DEST="~/.mozilla-iot/addons/almond-adapter/"
EXCLUDE="node_modules/"

echo "#### Running almond-adapter on local gateway in debug mode"
echo "#### Use Ctrl-C to exit and restart gateway in normal mode"

echo "#### Copying Almond Adaper files to rpi..."

rsync -avzP --delete --exclude ".git/*" --exclude "run.sh" . "${USER}@${HOST}:${DEST}"

echo "#### File copy complete!"

echo "#### Starting debug mode on rpi..."

ssh -t "${USER}@${HOST}" "bash ${DEST}debug.sh;"

echo "#### Connection closed"
