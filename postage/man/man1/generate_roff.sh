#!/bin/sh

# npm install -g marked-man

marked-man ./postage.1.md > ./postage.1.in
#marked-man ./postage.1.md > ./postage.1.in.temp && man ./postage.1.in.temp
