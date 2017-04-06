#!/bin/bash

set -e

rm -rf postage-master master.zip ~/.mozilla ~/.postage

wget https://github.com/workflowproducts/postage/archive/master.zip
unzip master.zip
cd postage-master/

./configure && make -j32
make test-common

./postage/postage -c ./postage/config/postage.conf -d ./postage/config/postage-connections.conf -n true -t 300 -r ./postage/web_root -l info & export POSTAGEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true"
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $POSTAGEPID

rm -rf ~/.mozilla ~/.postage

sudo make install

/usr/local/sbin/postage & export POSTAGEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true"
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $POSTAGEPID

sudo make uninstall

kill -9 $(cat postage/postgres.pid)

cd ..

rm -rf postage-master master.zip ~/.mozilla ~/.postage
