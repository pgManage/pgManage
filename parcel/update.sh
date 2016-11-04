#/bin/sh

set -e
( cd ../envelope && make all )

rm -rf app/envelope
mkdir app/envelope
mkdir app/envelope/config
cp ../envelope/envelope app/envelope/envelope
cp -r ./web_root app/envelope/web_root
cp ../envelope/config/envelope.conf app/envelope/config/envelope.conf
cp -r ./postgresql-portable-$(uname | tr A-Z a-z)$(getconf LONG_BIT)/ app/envelope/postgresql/
