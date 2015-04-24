rm -rf build
mkdir build
cp README.md build
cp package.json build

cat uv-api.js >> build/uv-api.js
printf "\nmodule.exports = uv\n" >> build/uv-api.js

cd build && deliver publish