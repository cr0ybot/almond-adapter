
Almond Adapter
==============

[![mozilla-iot addon](https://img.shields.io/badge/mozilla--iot-addon-blue.svg?logo=mozilla&logoColor=white&colorA=black&colorB=5d9bc7)](https://iot.mozilla.org/)

> This is a work in progress! Please check the [Release 1.0.0 milestone](https://github.com/cr0ybot/almond-adapter/milestone/1) for progress.

An Unofficial [Securifi Almond](https://www.securifi.com/almond) adapter plugin for Mozilla IoT Gateway

Exposes Z-Wave and ZigBee devices connected to Almond to the Things Gateway via the [Websockets API](https://wiki.securifi.com/index.php/Websockets_Documentation).

Developed using [Almond+ (2014)](https://www.securifi.com/almondplus)

## Development

For ease of development, the file `run.sh` will copy the addon to a local RPi Things Gateway at `gateway.local` with username `pi`. This script also attempts to restart the gateway in debug mode by running the `debug.sh` script remotely.

## Disclaimer

This is an unofficial plugin that is not endorsed by or affiliated with Securifi Inc. or its subsidiaries.
