#!/bin/bash

rm -f SHA256SUMS
sha256sum *.json *.js README.md LICENSE > SHA256SUMS
npm pack
