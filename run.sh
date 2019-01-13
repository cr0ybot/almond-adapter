#!/bin/bash

# This script uploads the addon to the local RPi Things Gateway for testing

USER="pi"
HOST="gateway.local"
DEST="~/.mozilla-iot/addons/almond-adapter/"
EXCLUDE="node_modules/"

echo "#### Copying Almond Adaper files to rpi..."

rsync -avzP --delete --exclude ".git/*" --exclude "run.sh" . "${USER}@${HOST}:${DEST}"

echo "#### File copy complete!"

echo "#### Starting debug mode on rpi..."

ssh -t "${USER}@${HOST}" "bash ${DEST}debug.sh;"

echo "#### Connection closed"
