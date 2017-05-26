#!/bin/bash

set -e

if test $(uname -s) = "Linux"; then
	MAKE=make
elif test $(uname -s) = "Darwin"; then
	MAKE=make
elif test $(uname -s) = "FreeBSD"; then
	MAKE=gmake
elif test $(uname -s) = "OpenBSD"; then
	MAKE=gmake
else
	MAKE=make
fi

mkdir test-envelope
cd test-envelope

if test $(uname -s) = "OpenBSD"; then
	echo "skipping electron tester"
else
cat << EOF > package.json
{
  "name": "test-envelope",
  "scripts": {
    "start": "electron ."
  },
  "devDependencies": {
    "electron": "^1.6.2"
  },
  "main": "index.js"
}
EOF

cat << EOF > index.js
const electron = require('electron');
let window = null;

electron.app.on('ready', function () {
        window = new electron.BrowserWindow();
        window.loadURL('127.0.0.1:8888/test/index.html?http_export=false&ws_file_app=true&ws_file_role=true&ws_file_web_root=true&ws_delete=true&http_file=true&http_upload=true&ws_select=true&ws_insert=true&ws_update=true&_http_auth=true&http_action=true&ws_action=true');
});


electron.app.on('window-all-closed', function () {
        electron.app.quit();
});

EOF

npm install
fi

rm -rf envelope-master master.zip ~/.mozilla

wget https://github.com/workflowproducts/envelope/archive/master.zip
unzip master.zip
cd envelope-master/

./configure && $MAKE -j32
$MAKE test-common

./envelope/envelope -c ./envelope/config/envelope.conf -d ./envelope/config/envelope-connections.conf -t 300 -r ./envelope/web_root -y ./envelope/app -z ./envelope/role -l info & export ENVELOPEPID="$!"
sleep 5

if test $(uname -s) = "OpenBSD"; then
	xdg-open "127.0.0.1:8888/test/index.html?http_export=false&ws_file_app=true&ws_file_role=true&ws_file_web_root=true&ws_delete=true&http_file=true&http_upload=true&ws_select=true&ws_insert=true&ws_update=true&_http_auth=true&http_action=true&ws_action=true" &
	printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
else
	npm start & export ELECTRONPID="$!"
	printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
	kill $ELECTRONPID
fi
kill $ENVELOPEPID

rm -rf ~/.mozilla ~/.envelope

sudo $MAKE install

sudo chown -R super /usr/local/etc/envelope/

/usr/local/sbin/envelope & export ENVELOPEPID="$!"
sleep 5
if test $(uname -s) = "OpenBSD"; then
	xdg-open "http://127.0.0.1:8888/test.html" &
	printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
else
	npm start & export ELECTRONPID="$!"
	printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
	kill $ELECTRONPID
fi
kill $ENVELOPEPID

sudo $MAKE uninstall

kill -9 $(cat envelope/postgres.pid)

cd ..

rm -rf envelope-master master.zip ~/.mozilla

cd ..
