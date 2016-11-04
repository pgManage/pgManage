#/bin/sh

set -e
( cd ../postcard && make all )

rm -rf app/postcard
mkdir app/postcard
cp -r ./web_root app/postcard/web_root
cp -r ./postgresql-portable-$(uname | tr A-Z a-z)$(getconf LONG_BIT)/ app/postcard/postgresql/
