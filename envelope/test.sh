 #!/bin/bash

 set -e

rm -rf envelope-master master.zip ~/.mozilla ~/.envelope

wget https://github.com/workflowproducts/envelope/archive/master.zip
unzip master.zip
cd envelope-master/

./configure && make -j32
make test-common

./envelope/envelope -c ./envelope/config/envelope.conf -d ./envelope/config/envelope-connections.conf -n true -t 300 -r ./envelope/web_root -l info & export ENVELOPEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8888/test.html"
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $ENVELOPEPID

rm -rf ~/.mozilla ~/.envelope

sudo make install

/usr/local/sbin/envelope & export ENVELOPEPID="$!"
sleep 5
xdg-open "http://127.0.0.1:8888/test.html"
printf "HTTP/1.1 200 OK\r\n\r\n\r\n" | ncat -l -p 45654
kill $ENVELOPEPID

sudo make uninstall

kill $(cat envelope/postgres.pid)

cd ..

rm -rf envelope-master master.zip ~/.mozilla ~/.envelope
