#!/bin/bash

bundle-deps
rm -f SHA256SUMS
npm ci --only=prod # this also removes node_modules
sha256sum package.json *.js LICENSE README.md > SHA256SUMS
find node_modules -type f -exec sha256sum {} \; >> SHA256SUMS
mkdir dist
cd dist
package=$(npm pack ../)

echo "#### Packaging complete: dist/${package}"
echo "#### Run 'npm install' again to resume development"
