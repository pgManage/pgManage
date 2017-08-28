#/bin/sh

set -e
( cd ../src && make all )

rm -rf app/postage
mkdir app/postage
cp -r ../src/web_root app/postage/web_root
cp -r ../src/config app/postage/config

if test $(uname -s) = "Darwin"; then
	clang ../dependencies/libev/ev.o ../src/*.o ../db_framework_pq/*.o -lm mac_lib/libpq.a /usr/local/opt/openssl/lib/libssl.a /usr/local/opt/openssl/lib/libcrypto.a -lm -O3 -g -fno-strict-aliasing -o app/postage/postage

else
	cp ../src/postage app/postage/postage
fi
