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

rm -rf postage-master master.zip ~/.mozilla ~/.postage

wget https://github.com/workflowproducts/postage/archive/master.zip
unzip master.zip
cd postage-master/

./configure && $MAKE -j32
$MAKE test-common

./postage/postage -c ./postage/config/postage.conf -d ./postage/config/postage-connections.conf -n true -t 300 -r ./postage/web_root -l info & export POSTAGEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true"
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $POSTAGEPID

rm -rf ~/.mozilla ~/.postage

sudo $MAKE install

/usr/local/sbin/postage & export POSTAGEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true"
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $POSTAGEPID

sudo $MAKE uninstall

kill -9 $(cat postage/postgres.pid)

cd ..

rm -rf postage-master master.zip ~/.mozilla ~/.postage
