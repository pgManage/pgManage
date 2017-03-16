#!/bin/sh

# npm install -g marked-man

marked-man ./postage.1.md > ./postage.1.in
marked-man --format=html ./postage.1.md > ../../web_root/postage/app/postage.1.html
#marked-man ./postage.1.md > ./postage.1.in.temp && man ./postage.1.in.temp
