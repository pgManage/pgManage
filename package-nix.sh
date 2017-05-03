#!/bin/sh

git pull

make clean
./configure
make all -j4

cd postage_electron

./update.sh

npm run dist
