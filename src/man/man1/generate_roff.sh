#!/bin/sh

# npm install -g marked-man

marked-man ./pgmanage.1.md > ./pgmanage.1.in
marked-man --format=html ./pgmanage.1.md > ../../web_root/pgmanage/app/pgmanage.1.html
#marked-man ./pgmanage.1.md > ./pgmanage.1.in.temp && man ./pgmanage.1.in.temp
