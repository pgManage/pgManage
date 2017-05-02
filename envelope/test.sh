#!/bin/bash

set -e

mkdir test-envelope
cd test-envelope

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
        window.loadURL('http://127.0.0.1:8888/test.html');
});


electron.app.on('window-all-closed', function () {
        electron.app.quit();
});

EOF

npm install

rm -rf envelope-master master.zip ~/.mozilla

wget https://github.com/workflowproducts/envelope/archive/master.zip
unzip master.zip
cd envelope-master/

./configure && make -j32
make test-common

./envelope/envelope -c ./envelope/config/envelope.conf -d ./envelope/config/envelope-connections.conf -t 300 -r ./envelope/web_root -y ./envelope/app -z ./envelope/role -l info & export ENVELOPEPID="$!"
sleep 5
#xdg-open "http://127.0.0.1:8888/test.html"
npm start & export ELECTRONPID="$!"
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $ENVELOPEPID
kill $ELECTRONPID

rm -rf ~/.mozilla ~/.envelope

sudo make install

sudo chown -R super /usr/local/etc/envelope/

/usr/local/sbin/envelope & export ENVELOPEPID="$!"
sleep 5
#xdg-open "http://127.0.0.1:8888/test.html"
npm start & export ELECTRONPID="$!"
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $ENVELOPEPID
kill $ELECTRONPID

sudo make uninstall

kill -9 $(cat envelope/postgres.pid)

cd ..

rm -rf envelope-master master.zip ~/.mozilla

cd ..
