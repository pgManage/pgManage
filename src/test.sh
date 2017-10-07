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

rm -rf pgmanage-master master.zip ~/.mozilla ~/.pgmanage

wget https://github.com/workflowproducts/pgmanage/archive/master.zip
unzip master.zip
cd pgmanage-master/

./configure && $MAKE -j32
$MAKE test-common

./src/pgmanage -c ./src/config/pgmanage.conf -d ./src/config/pgmanage-connections-test.conf -n true -t 300 -r ./src/web_root -l info & export PGMANAGEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8080/pgmanage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true" &
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $PGMANAGEPID
sleep 2

rm -rf ~/.mozilla ~/.pgmanage

sudo $MAKE install

/usr/local/sbin/pgmanage -d ./src/config/pgmanage-connections-test.conf & export PGMANAGEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8080/pgmanage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true" &
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $PGMANAGEPID
sleep 2

sudo $MAKE uninstall

rm -rf ~/.pgmanage
cd pgmanage_electron
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

	mkdir ~/.pgmanage
	cp ../src/config/pgmanage.conf ~/.pgmanage
	cp ../src/config/pgmanage-connections-test.conf ~/.pgmanage/pgmanage-connections.conf

	/opt/pgManage/pgmanage --pgmanage-test & export PGMANAGEPID="$!"
	printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
	kill $PGMANAGEPID

	command -v apt-get >/dev/null 2>&1 && {
		sudo apt-get -y remove pgmanage
		cp -f ./dist/*.deb /mnt/Groups/wfprod_group/pgmanage/packages/
		md5sum ./dist/*.deb >> /mnt/Groups/wfprod_group/pgmanage/packages/md5s.txt
	}
	command -v yum >/dev/null 2>&1 && {
		sudo yum -y remove pgManage
		cp -f ./dist/*.rpm /mnt/Groups/wfprod_group/pgmanage/packages/
		md5sum ./dist/*.rpm >> /mnt/Groups/wfprod_group/pgmanage/packages/md5s.txt
	}

#elif test $(uname -s) = "FreeBSD"; then

fi
cd ..

kill -9 $(cat pgmanage/postgres.pid)

cd ..

rm -rf pgmanage-master master.zip ~/.mozilla ~/.pgmanage
