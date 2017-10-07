#!/bin/sh

git pull

make clean
./configure
make all -j4

cd pgmanage_electron

rm -rf node_modules app/node_modules
npm install && cd app && npm install && cd ..

./update.sh

npm run dist

cd ..
