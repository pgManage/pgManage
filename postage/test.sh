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
xdg-open "http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true" &
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $POSTAGEPID

rm -rf ~/.mozilla ~/.postage

sudo $MAKE install

/usr/local/sbin/postage & export POSTAGEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true" &
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $POSTAGEPID

sudo $MAKE uninstall

rm -rf ~/.postage
cd postage_electron
rm -rf node_modules app/node_modules
npm install && cd app && npm install && cd ..
./update.sh
if test $(uname -s) = "Linux"; then
	command -v apt-get >/dev/null 2>&1 && {
		node_modules/.bin/build --linux=deb
		sudo apt-get -y install ./dist/*.deb
	}
	command -v yum >/dev/null 2>&1 && {
		node_modules/.bin/build --linux=rpm
		sudo yum -y install ./dist/*.rpm
	}
	/opt/Postage/postage --postage-test & export POSTAGEPID="$!"
	printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
	kill $POSTAGEPID

	command -v apt-get >/dev/null 2>&1 && {
		sudo apt-get -y remove postage
		cp -f ./dist/*.deb /mnt/Groups/wfprod_group/postage/packages/
	}
	command -v yum >/dev/null 2>&1 && {
		sudo yum -y remove Postage
		cp -f ./dist/*.rpm /mnt/Groups/wfprod_group/postage/packages/
	}

#elif test $(uname -s) = "Darwin"; then
	./dist/mac/Postage.app/Contents/MacOS/Postage --postage-test & export POSTAGEPID="$!"
	printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
	kill $POSTAGEPID
	cp -f ./dist/*.dmp /mnt/Groups/wfprod_group/postage/packages/

#elif test $(uname -s) = "FreeBSD"; then

fi
cd ..

kill -9 $(cat postage/postgres.pid)

cd ..

rm -rf postage-master master.zip ~/.mozilla ~/.postage
